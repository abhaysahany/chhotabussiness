<?php

namespace App\Http\Controllers;

use App\Models\Reward;
use App\Models\RewardClaim;
use App\Models\User;
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
            $imageUrl = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600';
        }

        $reward = Reward::create([
            'title' => $request->input('title'),
            'required_bp' => (int) $request->input('required_bp'),
            'category' => $request->input('category') ?: 'Gadgets & Electronics',
            'image' => $imageUrl,
            'description' => $request->input('description') ?: 'Exclusive network rewards program item.',
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

            // If rejecting a pending claim, refund Business Points (BP) back to member wallet
            if ($newStatus === 'rejected' && $claim->status !== 'rejected') {
                if ($claim->user_id) {
                    $user = User::find($claim->user_id);
                    if ($user) {
                        $user->bp_balance = (float) $user->bp_balance + (float) $claim->points_deducted;
                        $user->save();
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
            return response()->json(['status' => 'error', 'message' => 'Failed to update claim: ' . $e->getMessage()], 500);
        }
    }

    /**
     * User: List all active rewards catalog
     */
    public function indexUserRewards(Request $request)
    {
        if (Reward::count() === 0) {
            $defaultRewards = [
                ['title' => 'Starter Welcome Kit', 'category' => 'Welcome', 'required_bp' => 100, 'reward_value_inr' => 2500, 'status' => 'active', 'description' => 'Executive leather notebook, premium pen set & company identity lapel pin.', 'image' => 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500'],
                ['title' => 'Fitness Smartwatch Pro', 'category' => 'Gadgets', 'required_bp' => 250, 'reward_value_inr' => 7500, 'status' => 'active', 'description' => 'Bluetooth Calling, AMOLED display, IP68 water resistance with heart-rate tracking.', 'image' => 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
                ['title' => '10.5" Android 5G Tablet PC', 'category' => 'Electronics', 'required_bp' => 500, 'reward_value_inr' => 18000, 'status' => 'active', 'description' => 'Octa-core 8GB RAM + 128GB Storage, high resolution screen with stylus support.', 'image' => 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500'],
                ['title' => 'Goa 3N/4D 5-Star Luxury Retreat', 'category' => 'Travel', 'required_bp' => 1200, 'reward_value_inr' => 45000, 'status' => 'active', 'description' => 'All-inclusive couple tour package with flight tickets, beach resort stay and gala dinner.', 'image' => 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500'],
                ['title' => 'Thailand International Tour (5D/4N)', 'category' => 'International Travel', 'required_bp' => 2500, 'reward_value_inr' => 110000, 'status' => 'active', 'description' => 'Bangkok & Pattaya luxury international holiday with visa support, flights, and 5-star hotel.', 'image' => 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=500'],
                ['title' => 'Royal Enfield Classic 350 Bike', 'category' => 'Automobile', 'required_bp' => 6000, 'reward_value_inr' => 240000, 'status' => 'active', 'description' => 'Brand new Royal Enfield 350cc motorcycle registered in winner’s name with 5-year insurance.', 'image' => 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500'],
                ['title' => 'Luxury SUV Car (Tata Harrier / Creta)', 'category' => 'Automobile', 'required_bp' => 15000, 'reward_value_inr' => 1800000, 'status' => 'active', 'description' => 'Grand Achievement Car award for Crown Leaders fully paid with on-road registration.', 'image' => 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500'],
            ];

            foreach ($defaultRewards as $r) {
                Reward::create($r);
            }
        }

        $rewards = Reward::where('status', 'active')->orderBy('required_bp', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'rewards' => $rewards,
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

        $query = RewardClaim::query();
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
     * User: Claim reward using Business Points (BP) wallet balance and save directly to database
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

            $currentBp = (float) $user->bp_balance;
            $requiredBp = (float) $reward->required_bp;

            // Check if user has enough Business Points balance in database
            if ($currentBp < $requiredBp) {
                $deficit = $requiredBp - $currentBp;
                return response()->json([
                    'status' => 'error',
                    'message' => "Insufficient Business Points (BP)! You have {$currentBp} BP but need {$requiredBp} BP to claim this reward (Short by {$deficit} BP).",
                    'current_bp' => $currentBp,
                    'required_bp' => $requiredBp,
                ], 422);
            }

            // Deduct Business Points in database
            $bpBefore = $currentBp;
            $bpAfter = $currentBp - $requiredBp;
            $user->bp_balance = $bpAfter;
            $user->save();

            $latestClaim = RewardClaim::latest('id')->first();
            $nextSeq = $latestClaim ? ($latestClaim->id + 101) : (RewardClaim::count() + 101);
            $claimCode = 'CLM-' . date('Y') . '-' . $nextSeq;

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
                'points_deducted' => $requiredBp,
                'bp_balance_before' => $bpBefore,
                'bp_balance_after' => $bpAfter,
                'shipping_address' => $request->input('shipping_address') ?: ($user->location ?? 'Registered Profile Address'),
                'shipping_city' => $request->input('shipping_city') ?: 'Registered City',
                'shipping_state' => $request->input('shipping_state') ?: 'Registered State',
                'shipping_pincode' => $request->input('shipping_pincode') ?: '400001',
                'status' => 'pending',
                'claim_date' => now(),
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => "🎉 Congratulations! Reward '{$reward->title}' claimed successfully! {$requiredBp} BP deducted from your wallet.",
                'claim' => $claim,
                'remaining_bp' => $bpAfter,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Failed to claim reward: ' . $e->getMessage()], 500);
        }
    }
}
