<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminUserController extends Controller
{
    /**
     * List all users from MySQL database with search, role, and status filters.
     */
    public function index(Request $request)
    {
        $query = User::query()->orderBy('id', 'desc');

        if ($request->filled('search')) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('email', 'like', $search)
                  ->orWhere('phone', 'like', $search)
                  ->orWhere('user_code', 'like', $search);
            });
        }

        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('rank', 'like', '%' . $request->role . '%');
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', strtolower($request->status));
        }

        $users = $query->get()->map(function ($u) {
            return [
                'id' => $u->user_code ?: ('USR-' . $u->id),
                'dbId' => $u->id,
                'name' => $u->name,
                'username' => $u->user_code ?: strtolower(str_replace(' ', '_', $u->name)),
                'email' => $u->email,
                'phone' => $u->phone ?: '',
                'role' => $u->rank ?: 'User',
                'status' => ucfirst($u->status ?: 'active'),
                'kycStatus' => ucfirst($u->kyc_status ?: 'pending'),
                'joinedDate' => $u->created_at ? $u->created_at->format('Y-m-d') : date('Y-m-d'),
                'bpBalance' => (float)($u->bp_balance ?: 0),
                'commissionWallet' => (float)($u->commission_balance ?: 0),
                'address' => $u->location ?: '',
            ];
        });

        return response()->json([
            'status' => 'success',
            'success' => true,
            'users' => $users,
            'data' => $users,
            'total' => $users->count(),
        ]);
    }

    /**
     * Update an existing user in MySQL database.
     */
    public function update(Request $request, $id)
    {
        $user = User::where('id', $id)
            ->orWhere('user_code', $id)
            ->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:30',
            'role' => 'nullable|string|max:100',
            'status' => 'nullable|string|in:active,suspended,pending,Active,Suspended,Pending',
            'address' => 'nullable|string|max:255',
            'bpBalance' => 'nullable|numeric|min:0',
            'commissionWallet' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($request->has('name')) $user->name = $request->name;
        if ($request->has('email')) $user->email = $request->email;
        if ($request->has('phone')) $user->phone = $request->phone;
        if ($request->has('role')) $user->rank = $request->role;
        if ($request->has('status')) $user->status = strtolower($request->status);
        if ($request->has('address')) $user->location = $request->address;
        if ($request->has('bpBalance')) $user->bp_balance = $request->bpBalance;
        if ($request->has('commissionWallet')) $user->commission_balance = $request->commissionWallet;

        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'User account updated successfully.',
            'user' => [
                'id' => $user->user_code ?: ('USR-' . $user->id),
                'dbId' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->rank ?: 'User',
                'status' => ucfirst($user->status ?: 'active'),
                'kycStatus' => ucfirst($user->kyc_status ?: 'pending'),
                'joinedDate' => $user->created_at ? $user->created_at->format('Y-m-d') : date('Y-m-d'),
                'bpBalance' => (float)($user->bp_balance ?: 0),
                'commissionWallet' => (float)($user->commission_balance ?: 0),
                'address' => $user->location ?: '',
            ],
        ]);
    }

    /**
     * Toggle a user's active / suspended status in MySQL database.
     */
    public function toggleStatus(Request $request, $id)
    {
        $user = User::where('id', $id)
            ->orWhere('user_code', $id)
            ->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found.',
            ], 404);
        }

        $nextStatus = strtolower($user->status) === 'active' ? 'suspended' : 'active';
        $user->status = $nextStatus;
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => "User status updated to {$nextStatus}.",
            'current_status' => ucfirst($nextStatus),
        ]);
    }
}
