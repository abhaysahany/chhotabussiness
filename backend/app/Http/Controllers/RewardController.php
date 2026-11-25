<?php

namespace App\Http\Controllers;

use App\Models\Reward;
use App\Models\RewardClaim;
use App\Models\User;
use App\Models\DiamondWallet;
use App\Models\DiamondTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RewardController extends Controller
{
    /**
     * Admin: List all rewards
     */
    public function indexAdmin(Request $request)
    {
        $query = Reward::query();

        if ($request->has('category') && $request->category !== 'all' && !empty($request->category)) {
            $query->where('category', $request->category);
        }

        if ($request->has('status') && $request->status !== 'all' && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)
                  ->orWhere('description', 'like', $search)
                  ->orWhere('category', 'like', $search);
            });
        }

        $rewards = $query->orderBy('required_bp', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'rewards' => $rewards,
            'total' => $rewards->count(),
        ]);
    }

    /**
     * Admin: Create new reward item
     */
    public function storeReward(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'required_bp' => 'required|numeric|min:1',
            'category' => 'nullable|string',
            'image' => 'nullable',
            'image_file' => 'nullable|image|max:10240', // up to 10MB
            'description' => 'nullable|string',
            'reward_value_inr' => 'nullable|numeric',
            'status' => 'nullable|string',
        ]);

        $imageUrl = $request->input('image');

        if ($request->hasFile('image_file')) {
            $file = $request->file('image_file');
            $filename = 'reward_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/rewards');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0777, true);
            }
            $file->move($destinationPath, $filename);
            $imageUrl = url('uploads/rewards/' . $filename);
        } elseif ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = 'reward_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/rewards');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0777, true);
            }
            $file->move($destinationPath, $filename);
            $imageUrl = url('uploads/rewards/' . $filename);
        }

        if (empty($imageUrl)) {
            $imageUrl = null;
        }

        $reward = Reward::create([
            'title' => $request->input('title'),
            'required_bp' => (int) $request->input('required_bp'),
            'category' => $request->input('category') ?: 'Gadgets & Electronics',
            'image' => $imageUrl,
            'description' => $request->input('description') ?: null,
            'reward_value_inr' => $request->input('reward_value_inr') ?: null,
            'status' => $request->input('status') ?: 'active',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Reward '{$reward->title}' created successfully!",
            'reward' => $reward,
        ], 201);
    }

    /**
     * Admin: Update existing reward
     */
    public function updateReward(Request $request, $id)
    {
        $reward = Reward::find($id);
        if (!$reward) {
            return response()->json(['status' => 'error', 'message' => 'Reward item not found.'], 404);
        }

        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'required_bp' => 'sometimes|required|numeric|min:1',
            'category' => 'nullable|string|max:100',
            'image' => 'nullable|string|max:2000',
            'image_file' => 'nullable|image|max:10240', // up to 10MB
            'description' => 'nullable|string',
            'reward_value_inr' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        $imageUrl = $request->input('image') ?: $reward->image;

        if ($request->hasFile('image_file')) {
            $file = $request->file('image_file');
            $filename = 'reward_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/rewards');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0777, true);
            }
            $file->move($destinationPath, $filename);
            $imageUrl = url('uploads/rewards/' . $filename);
        } elseif ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = 'reward_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/rewards');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0777, true);
            }
            $file->move($destinationPath, $filename);
            $imageUrl = url('uploads/rewards/' . $filename);
        }

        $reward->update([
            'title' => $request->input('title', $reward->title),
            'required_bp' => $request->has('required_bp') ? (int) $request->input('required_bp') : $reward->required_bp,
            'category' => $request->input('category', $reward->category),
            'image' => $imageUrl,
            'description' => $request->input('description', $reward->description),
            'reward_value_inr' => $request->input('reward_value_inr', $reward->reward_value_inr),
            'status' => $request->input('status', $reward->status),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Reward '{$reward->title}' updated successfully!",
            'reward' => $reward,
        ]);
    }

    /**
     * Admin: Delete reward
     */
    public function destroyReward(Request $request, $id)
    {
        $reward = Reward::find($id);
        if (!$reward) {
            return response()->json(['status' => 'error', 'message' => 'Reward item not found.'], 404);
        }

        $reward->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Reward deleted successfully.',
        ]);
    }

    /**
     * Admin: List all member reward claims
     */
    public function indexClaimsAdmin(Request $request)
    {
        $query = RewardClaim::query();

        if ($request->has('status') && $request->status !== 'all' && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('claim_code', 'like', $search)
                  ->orWhere('user_code', 'like', $search)
                  ->orWhere('member_name', 'like', $search)
                  ->orWhere('reward_title', 'like', $search)
                  ->orWhere('tracking_number', 'like', $search)
                  ->orWhere('shipping_city', 'like', $search);
            });
        }

        $claims = $query->orderBy('claim_date', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'claims' => $claims,
            'total' => $claims->count(),
        ]);
    }

    /**
     * Admin: Update claim fulfillment status (Approve, Dispatch, Deliver, Reject)
     */
    public function updateClaimStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:approved,dispatched,delivered,rejected',
            'tracking_number' => 'nullable|string|max:100',
            'courier_partner' => 'nullable|string|max:100',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        try {
            $claim = RewardClaim::find($id);
            if (!$claim) {
                return response()->json(['status' => 'error', 'message' => 'Reward claim not found.'], 404);
            }

            $newStatus = $request->input('status'); // approved | dispatched | delivered | rejected
            $tracking = $request->input('tracking_number') ?: $claim->tracking_number;
            $courier = $request->input('courier_partner') ?: $claim->courier_partner;
            $notes = $request->input('admin_notes') ?: $claim->admin_notes;

            // If rejecting a pending claim, refund Business Points (BP) / Diamonds back to member wallet
            if ($newStatus === 'rejected' && $claim->status !== 'rejected') {
                if ($claim->user_id) {
                    $user = User::find($claim->user_id);
                    if ($user) {
                        $user->bp_balance = (float) $user->bp_balance + (float) $claim->points_deducted;
                        $user->save();
                    }
                    $diamondWallet = DiamondWallet::where('user_id', $claim->user_id)->first();
                    if ($diamondWallet) {
                        $diamondWallet->diamond_balance = (float) $diamondWallet->diamond_balance + (float) $claim->points_deducted;
                        $diamondWallet->save();
                    }
                }
            }

            $claim->update([
                'status' => $newStatus,
                'tracking_number' => $tracking,
                'courier_partner' => $courier,
                'admin_notes' => $notes,
                'processed_date' => now(),
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => "Claim {$claim->claim_code} status updated to " . strtoupper($newStatus) . "!",
                'claim' => $claim,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Failed to update claim: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['status' => 'error', 'message' => 'Failed to update claim. Please try again shortly.'], 500);
        }
    }

    /**
     * User: List all active rewards catalog
     */
    public function indexUserRewards(Request $request)
    {
        $rewards = Reward::where('status', 'active')->orderBy('required_bp', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'rewards' => $rewards,
        ]);
    }

    /**
     * User: Get details of a single active reward
     */
    public function showUserReward(Request $request, $id)
    {
        $reward = Reward::where('status', 'active')->find($id);
        if (!$reward) {
            return response()->json([
                'status' => 'error',
                'message' => 'Reward item not found or is currently inactive.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'reward' => $reward,
        ]);
    }

    /**
     * User: List all claims by a user directly from database
     */
    public function indexUserClaims(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        $userCode = $request->input('user_code') ?: $user?->user_code;
        $userId = $user?->id ?: $request->input('user_id');

        $query = RewardClaim::with('reward:id,title,category,reward_value_inr,required_bp,description,image');
        if ($userId && $userCode) {
            $query->where(function ($q) use ($userId, $userCode) {
                $q->where('user_id', $userId)->orWhere('user_code', $userCode);
            });
        } elseif ($userId) {
            $query->where('user_id', $userId);
        } elseif ($userCode) {
            $query->where('user_code', $userCode);
        }

        $claims = $query->orderBy('claim_date', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'claims' => $claims,
        ]);
    }

    /**
     * User: Claim reward using Diamond balance and save directly to database
     */
    public function claimReward(Request $request)
    {
        DB::beginTransaction();
        try {
            $rewardId = $request->input('reward_id');
            $reward = Reward::find($rewardId);

            if (!$reward || $reward->status !== 'active') {
                return response()->json(['status' => 'error', 'message' => 'Selected reward is not active or available in database.'], 404);
            }

            // Identify user from authenticated token or request parameters
            $user = auth('sanctum')->user() ?: $request->user();
            if (!$user && $request->filled('user_code')) {
                $user = User::where('user_code', $request->input('user_code'))->first();
            }
            if (!$user && $request->filled('user_id')) {
                $user = User::find($request->input('user_id'));
            }

            if (!$user) {
                return response()->json(['status' => 'error', 'message' => 'User account not found in database.'], 404);
            }

            // Duplicate claim rapid protection (prevent double-clicks within 10 seconds for the same user and reward)
            $recentDuplicate = RewardClaim::where('user_id', $user->id)
                ->where('reward_id', $reward->id)
                ->where('created_at', '>=', now()->subSeconds(10))
                ->first();

            if ($recentDuplicate) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'A claim for this reward was just submitted. Please check Rewards Claimed history to avoid duplicate redemptions.',
                ], 429);
            }

            // Pessimistic row-level lock on diamond wallet and user
            $diamondWallet = DiamondWallet::where('user_id', $user->id)->lockForUpdate()->first();
            $lockedUser = User::where('id', $user->id)->lockForUpdate()->first() ?? $user;

            $currentDiamonds = $diamondWallet ? (float) $diamondWallet->diamond_balance : (float) $lockedUser->bp_balance;
            if ($diamondWallet && (float) $lockedUser->bp_balance > (float) $diamondWallet->diamond_balance) {
                $currentDiamonds = (float) $lockedUser->bp_balance;
            }
            $requiredDiamonds = (float) $reward->required_bp;

            // Check if user has enough Diamond balance in database
            if ($currentDiamonds < $requiredDiamonds) {
                $deficit = $requiredDiamonds - $currentDiamonds;
                return response()->json([
                    'status' => 'error',
                    'message' => "Insufficient Diamond Balance! You have {$currentDiamonds} Diamonds but need {$requiredDiamonds} Diamonds to claim this reward (Short by {$deficit} Diamonds).",
                    'current_diamonds' => $currentDiamonds,
                    'required_diamonds' => $requiredDiamonds,
                ], 422);
            }

            // Deduct Diamond balance in database
            $balanceBefore = $currentDiamonds;
            $balanceAfter = $currentDiamonds - $requiredDiamonds;

            $latestClaim = RewardClaim::latest('id')->first();
            $nextSeq = $latestClaim ? ($latestClaim->id + 101) : (RewardClaim::count() + 101);
            $claimCode = 'CLM-' . date('Y') . '-' . $nextSeq;

            if ($diamondWallet) {
                $diamondWallet->diamond_balance = $balanceAfter;
                $diamondWallet->save();

                DiamondTransaction::create([
                    'user_id' => $user->id,
                    'source_reference' => 'claim:' . $claimCode,
                    'reward_level' => 0,
                    'allocated_amount' => -($requiredDiamonds * 100),
                    'conversion_rate' => 100,
                    'diamond_quantity' => -$requiredDiamonds,
                    'balance_after' => $balanceAfter,
                    'transaction_type' => 'debit',
                    'description' => "Redeemed {$requiredDiamonds} Diamonds for reward: {$reward->title}",
                ]);
            }

            $lockedUser->bp_balance = $balanceAfter;
            $lockedUser->save();

            $claim = RewardClaim::create([
                'claim_code' => $claimCode,
                'user_id' => $user->id,
                'user_code' => $user->user_code ?: ('CB' . (100000 + $user->id)),
                'member_name' => $user->name,
                'member_email' => $user->email,
                'member_phone' => $request->input('shipping_phone') ?: ($user->phone ?? ''),
                'reward_id' => $reward->id,
                'reward_title' => $reward->title,
                'reward_image' => $reward->image,
                'points_deducted' => $requiredDiamonds,
                'bp_balance_before' => $balanceBefore,
                'bp_balance_after' => $balanceAfter,
                'shipping_address' => $request->input('shipping_address') ?: ($user->location ?? ''),
                'shipping_city' => $request->input('shipping_city') ?: '',
                'shipping_state' => $request->input('shipping_state') ?: '',
                'shipping_pincode' => $request->input('shipping_pincode') ?: null,
                'status' => 'pending',
                'claim_date' => now(),
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => "🎉 Congratulations! Reward '{$reward->title}' claimed successfully! {$requiredDiamonds} Diamonds deducted from your wallet.",
                'claim' => $claim->load('reward:id,title,category,reward_value_inr,required_bp,description,image'),
                'remaining_diamonds' => $balanceAfter,
                'remaining_bp' => $balanceAfter,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Failed to claim reward: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['status' => 'error', 'message' => 'Failed to claim reward. Please try again shortly.'], 500);
        }
    }
}
