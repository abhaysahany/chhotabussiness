<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\UserNotificationRead;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    /**
     * Admin: List all sent notification campaigns / logs
     */
    public function indexAdmin(Request $request)
    {
        $query = Notification::query();

        if ($request->has('type') && $request->type !== 'all' && !empty($request->type)) {
            $query->where('type', $request->type);
        }

        if ($request->has('audience') && $request->audience !== 'all' && !empty($request->audience)) {
            $query->where('target_audience', $request->audience);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)
                  ->orWhere('message', 'like', $search)
                  ->orWhere('target_user_code', 'like', $search)
                  ->orWhere('target_user_name', 'like', $search);
            });
        }

        $notifications = $query->orderBy('created_at', 'desc')->get();

        // Calculate aggregate statistics
        $totalSent = Notification::count();
        $totalRecipients = Notification::sum('recipients_count');
        $activeUserCount = User::where('kyc_status', 'verified')->count();
        $totalUserCount = User::count();

        return response()->json([
            'status' => 'success',
            'notifications' => $notifications,
            'stats' => [
                'total_broadcasts' => $totalSent,
                'total_impressions' => $totalRecipients,
                'active_members' => $activeUserCount,
                'total_members' => $totalUserCount,
            ],
        ]);
    }

    /**
     * Admin: Send a new notification to Single User, Active Users, Deactive Users, or All
     */
    public function sendNotification(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'nullable|string', // info | success | warning | announcement
            'target_audience' => 'required|string', // single_user | active_users | inactive_users | all_users
            'target_user_code' => 'nullable|string',
            'target_user_id' => 'nullable|integer',
            'action_url' => 'nullable|string',
        ]);

        $audience = $request->input('target_audience');
        $targetUserId = null;
        $targetUserCode = null;
        $targetUserName = null;
        $recipientsCount = 0;

        if ($audience === 'single_user') {
            $userCode = $request->input('target_user_code');
            $userId = $request->input('target_user_id');

            $user = null;
            if ($userId) {
                $user = User::find($userId);
            } elseif ($userCode) {
                $user = User::where('user_code', $userCode)->orWhere('email', $userCode)->first();
            }

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Selected target user was not found. Please provide a valid User Code or Email.',
                ], 422);
            }

            $targetUserId = $user->id;
            $targetUserCode = $user->user_code ?: ('CB' . (100000 + $user->id));
            $targetUserName = $user->name;
            $recipientsCount = 1;
        } elseif ($audience === 'active_users') {
            $recipientsCount = User::where('kyc_status', 'verified')->count();
            if ($recipientsCount === 0) $recipientsCount = User::count(); // Fallback if no KYC yet
        } elseif ($audience === 'inactive_users') {
            $recipientsCount = User::where('kyc_status', '!=', 'verified')->count();
        } else {
            // all_users
            $recipientsCount = User::count();
        }

        $notification = Notification::create([
            'title' => $request->input('title'),
            'message' => $request->input('message'),
            'type' => $request->input('type') ?: 'announcement',
            'target_audience' => $audience,
            'target_user_id' => $targetUserId,
            'target_user_code' => $targetUserCode,
            'target_user_name' => $targetUserName,
            'action_url' => $request->input('action_url') ?: null,
            'recipients_count' => $recipientsCount,
            'created_by' => 'Executive Admin Desk',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Notification successfully dispatched to {$recipientsCount} recipient(s)!",
            'notification' => $notification,
        ], 201);
    }

    /**
     * User: Get user's notifications stream (Targeted + Broadcast) with read flags
     */
    public function indexUser(Request $request)
    {
        $user = $request->user();
        $userCode = $request->input('user_code');
        $userId = $user?->id;

        if (!$user && $userCode) {
            $user = User::where('user_code', $userCode)->first();
            $userId = $user?->id;
        }

        if (!$user) {
            $user = User::first();
            $userId = $user?->id;
            $userCode = $user?->user_code;
        }

        $isVerified = ($user && $user->kyc_status === 'verified');

        // Fetch notifications relevant to this user
        $notifications = Notification::where(function ($query) use ($userId, $userCode, $isVerified) {
            // 1. Direct targeted to this user
            $query->where(function ($q) use ($userId, $userCode) {
                $q->where('target_audience', 'single_user')
                  ->where(function ($sq) use ($userId, $userCode) {
                      if ($userId) $sq->where('target_user_id', $userId);
                      if ($userCode) $sq->orWhere('target_user_code', $userCode);
                  });
            })
            // 2. Broadcast to all users
            ->orWhere('target_audience', 'all_users')
            // 3. Active users group
            ->orWhere(function ($q) use ($isVerified) {
                if ($isVerified) {
                    $q->where('target_audience', 'active_users');
                } else {
                    $q->where('target_audience', 'inactive_users');
                }
            });
        })
        ->orderBy('created_at', 'desc')
        ->take(50)
        ->get();

        // Get read notifications IDs for this user
        $readIds = [];
        if ($userId) {
            $readIds = UserNotificationRead::where('user_id', $userId)
                ->where('is_read', true)
                ->pluck('notification_id')
                ->toArray();
        }

        $mapped = $notifications->map(function ($n) use ($readIds) {
            $isRead = in_array($n->id, $readIds);
            return [
                'id' => $n->id,
                'title' => $n->title,
                'message' => $n->message,
                'type' => $n->type,
                'target_audience' => $n->target_audience,
                'action_url' => $n->action_url,
                'is_read' => $isRead,
                'created_at' => $n->created_at->toIso8601String(),
                'time_ago' => $n->created_at->diffForHumans(),
            ];
        });

        $unreadCount = $mapped->where('is_read', false)->count();

        return response()->json([
            'status' => 'success',
            'notifications' => $mapped->values(),
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * User: Mark a specific notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();
        $userCode = $request->input('user_code');
        $userId = $user?->id;

        if (!$user && $userCode) {
            $user = User::where('user_code', $userCode)->first();
            $userId = $user?->id;
        }

        if (!$userId && $user) {
            $userId = $user->id;
        }

        if ($userId) {
            UserNotificationRead::updateOrCreate(
                ['user_id' => $userId, 'notification_id' => $id],
                ['user_code' => $userCode ?: $user?->user_code, 'is_read' => true, 'read_at' => now()]
            );
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Notification marked as read.',
        ]);
    }

    /**
     * User: Mark all eligible notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        $userCode = $request->input('user_code');
        $userId = $user?->id;

        if (!$user && $userCode) {
            $user = User::where('user_code', $userCode)->first();
            $userId = $user?->id;
        }

        if (!$userId) {
            $user = User::first();
            $userId = $user?->id;
        }

        if ($userId) {
            $notifications = Notification::all();
            foreach ($notifications as $n) {
                UserNotificationRead::updateOrCreate(
                    ['user_id' => $userId, 'notification_id' => $n->id],
                    ['user_code' => $userCode ?: $user?->user_code, 'is_read' => true, 'read_at' => now()]
                );
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'All notifications marked as read.',
        ]);
    }
}
