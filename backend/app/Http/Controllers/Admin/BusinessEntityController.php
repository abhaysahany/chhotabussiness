<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusinessEntity;
use App\Models\EntityCategory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class BusinessEntityController extends Controller
{
    /**
     * Display a listing of registered businesses.
     */
    public function index(Request $request)
    {
        $query = BusinessEntity::with('category');

        if ($request->has('category_id') && !empty($request->category_id)) {
            $query->where('entity_category_id', $request->category_id);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('owner_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('registration_no', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && in_array($request->status, ['pending', 'verified', 'rejected'])) {
            $query->where('verification_status', $request->status);
        }

        $businesses = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'businesses' => $businesses,
        ]);
    }

    /**
     * Register a new business with optional documents and password.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'entity_category_id' => 'required|exists:entity_categories,id',
            'name' => 'required|string|max:255',
            'owner_name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string',
            'password' => 'nullable|string|min:6',
            'address' => 'nullable|string',
            'registration_no' => 'nullable|string',
            'description' => 'nullable|string',
            'logo_url' => 'nullable|string',
            'website' => 'nullable|string',
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

        $business = BusinessEntity::create([
            'entity_category_id' => $request->entity_category_id,
            'name' => $request->name,
            'owner_name' => $request->owner_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => $hashedPassword,
            'address' => $request->address,
            'registration_no' => $request->registration_no,
            'description' => $request->description,
            'logo_url' => $request->logo_url ?? 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&auto=format&fit=crop&q=60',
            'website' => $request->website,
            'verification_status' => $request->verification_status ?? 'verified',
            'featured' => $request->has('featured') ? (bool)$request->featured : true,
            'documents' => $documents,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Business Entity registered successfully! Entity portal login credentials created.',
            'business' => $business->load('category'),
        ], 201);
    }

    /**
     * Show single business entity details.
     */
    public function show($id)
    {
        $business = BusinessEntity::with('category')->find($id);

        if (!$business) {
            return response()->json(['status' => 'error', 'message' => 'Business not found'], 404);
        }

        return response()->json(['status' => 'success', 'business' => $business]);
    }

    /**
     * Update business details and document statuses.
     */
    public function update(Request $request, $id)
    {
        $business = BusinessEntity::find($id);

        if (!$business) {
            return response()->json(['status' => 'error', 'message' => 'Business not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'entity_category_id' => 'required|exists:entity_categories,id',
            'name' => 'required|string|max:255',
            'owner_name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string',
            'password' => 'nullable|string|min:6',
            'address' => 'nullable|string',
            'registration_no' => 'nullable|string',
            'description' => 'nullable|string',
            'logo_url' => 'nullable|string',
            'website' => 'nullable|string',
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
            'owner_name' => $request->owner_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'registration_no' => $request->registration_no,
            'description' => $request->description,
            'logo_url' => $request->logo_url ?? $business->logo_url,
            'website' => $request->website,
            'verification_status' => $request->verification_status ?? $business->verification_status,
            'featured' => $request->has('featured') ? (bool)$request->featured : $business->featured,
            'documents' => $request->has('documents') ? $request->documents : $business->documents,
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

        $business->update($updateData);

        return response()->json([
            'status' => 'success',
            'message' => 'Business Entity updated successfully',
            'business' => $business->fresh()->load('category'),
        ]);
    }

    /**
     * Quick status / advertisement toggle.
     */
    public function updateStatus(Request $request, $id)
    {
        $business = BusinessEntity::find($id);

        if (!$business) {
            return response()->json(['status' => 'error', 'message' => 'Business not found'], 404);
        }

        if ($request->has('verification_status')) {
            $business->verification_status = $request->verification_status;
        }

        if ($request->has('featured')) {
            $business->featured = (bool)$request->featured;
        }

        $business->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Business status updated successfully',
            'business' => $business->load('category'),
        ]);
    }

    /**
     * Delete registered business.
     */
    public function destroy($id)
    {
        $business = BusinessEntity::find($id);

        if (!$business) {
            return response()->json(['status' => 'error', 'message' => 'Business not found'], 404);
        }

        $business->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Business Entity deleted successfully',
        ]);
    }
}
