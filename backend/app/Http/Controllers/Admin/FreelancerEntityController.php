<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FreelancerEntity;
use App\Models\EntityCategory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class FreelancerEntityController extends Controller
{
    /**
     * Display a listing of registered freelancers.
     */
    public function index(Request $request)
    {
        $query = FreelancerEntity::with('category');

        if ($request->has('category_id') && !empty($request->category_id)) {
            $query->where('entity_category_id', $request->category_id);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && in_array($request->status, ['pending', 'verified', 'rejected'])) {
            $query->where('verification_status', $request->status);
        }

        $freelancers = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'freelancers' => $freelancers,
        ]);
    }

    /**
     * Register a new freelancer with optional verification documents and password.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'entity_category_id' => 'required|exists:entity_categories,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string',
            'password' => 'nullable|string|min:6',
            'title' => 'required|string|max:255',
            'experience_years' => 'nullable|integer',
            'hourly_rate' => 'nullable|string',
            'bio' => 'nullable|string',
            'avatar_url' => 'nullable|string',
            'portfolio_link' => 'nullable|string',
            'verification_status' => 'nullable|in:pending,verified,rejected',
            'featured' => 'nullable|boolean',
            'documents' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $passwordRaw = !empty($request->password) ? $request->password : 'password123';
        $hashedPassword = Hash::make($passwordRaw);

        // Sync or Create standard user account for Entity Portal login
        User::updateOrCreate(
            ['email' => $request->email],
            [
                'name' => $request->name,
                'password' => $hashedPassword,
            ]
        );

        // Documents array is strictly optional (empty array if not provided)
        $documents = $request->has('documents') ? $request->documents : [];

        $freelancer = FreelancerEntity::create([
            'entity_category_id' => $request->entity_category_id,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => $hashedPassword,
            'title' => $request->title,
            'experience_years' => $request->experience_years ?? 3,
            'hourly_rate' => $request->hourly_rate ?? '₹750/hr',
            'bio' => $request->bio,
            'avatar_url' => $request->avatar_url ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=60',
            'portfolio_link' => $request->portfolio_link,
            'verification_status' => $request->verification_status ?? 'verified',
            'featured' => $request->has('featured') ? (bool)$request->featured : true,
            'documents' => $documents,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Freelancer registered successfully! Entity portal login credentials created.',
            'freelancer' => $freelancer->load('category'),
        ], 201);
    }

    /**
     * Show single freelancer entity details.
     */
    public function show($id)
    {
        $freelancer = FreelancerEntity::with('category')->find($id);

        if (!$freelancer) {
            return response()->json(['status' => 'error', 'message' => 'Freelancer not found'], 404);
        }

        return response()->json(['status' => 'success', 'freelancer' => $freelancer]);
    }

    /**
     * Update freelancer details and document statuses.
     */
    public function update(Request $request, $id)
    {
        $freelancer = FreelancerEntity::find($id);

        if (!$freelancer) {
            return response()->json(['status' => 'error', 'message' => 'Freelancer not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'entity_category_id' => 'required|exists:entity_categories,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string',
            'password' => 'nullable|string|min:6',
            'title' => 'required|string|max:255',
            'experience_years' => 'nullable|integer',
            'hourly_rate' => 'nullable|string',
            'bio' => 'nullable|string',
            'avatar_url' => 'nullable|string',
            'portfolio_link' => 'nullable|string',
            'verification_status' => 'nullable|in:pending,verified,rejected',
            'featured' => 'nullable|boolean',
            'documents' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $updateData = [
            'entity_category_id' => $request->entity_category_id,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'title' => $request->title,
            'experience_years' => $request->experience_years ?? $freelancer->experience_years,
            'hourly_rate' => $request->hourly_rate ?? $freelancer->hourly_rate,
            'bio' => $request->bio,
            'avatar_url' => $request->avatar_url ?? $freelancer->avatar_url,
            'portfolio_link' => $request->portfolio_link,
            'verification_status' => $request->verification_status ?? $freelancer->verification_status,
            'featured' => $request->has('featured') ? (bool)$request->featured : $freelancer->featured,
            'documents' => $request->has('documents') ? $request->documents : $freelancer->documents,
        ];

        if (!empty($request->password)) {
            $hashed = Hash::make($request->password);
            $updateData['password'] = $hashed;

            User::updateOrCreate(
                ['email' => $request->email],
                [
                    'name' => $request->name,
                    'password' => $hashed,
                ]
            );
        }

        $freelancer->update($updateData);

        return response()->json([
            'status' => 'success',
            'message' => 'Freelancer updated successfully',
            'freelancer' => $freelancer->fresh()->load('category'),
        ]);
    }

    /**
     * Quick status / advertisement toggle.
     */
    public function updateStatus(Request $request, $id)
    {
        $freelancer = FreelancerEntity::find($id);

        if (!$freelancer) {
            return response()->json(['status' => 'error', 'message' => 'Freelancer not found'], 404);
        }

        if ($request->has('verification_status')) {
            $freelancer->verification_status = $request->verification_status;
        }

        if ($request->has('featured')) {
            $freelancer->featured = (bool)$request->featured;
        }

        $freelancer->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Freelancer status updated successfully',
            'freelancer' => $freelancer->load('category'),
        ]);
    }

    /**
     * Delete registered freelancer.
     */
    public function destroy($id)
    {
        $freelancer = FreelancerEntity::find($id);

        if (!$freelancer) {
            return response()->json(['status' => 'error', 'message' => 'Freelancer not found'], 404);
        }

        $freelancer->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Freelancer deleted successfully',
        ]);
    }
}
