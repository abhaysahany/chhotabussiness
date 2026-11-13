<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;

class UserProfileController extends Controller
{
    /**
     * Retrieve authenticated user profile
     */
    public function getProfile(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated.',
            ], 401);
        }

        return response()->json([
            'status' => 'success',
            'user' => $user,
        ]);
    }

    /**
     * Update user personal profile details
     */
    public function updateProfile(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:2|max:100',
            'phone' => 'nullable|string|max:20',
            'dob' => 'nullable|date_format:Y-m-d',
            'gender' => 'nullable|string|in:Male,Female,Other',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'zip_code' => 'nullable|string|max:20',
            'bio' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $user->name = trim($request->input('name'));
        if ($request->has('phone')) {
            $user->phone = $request->input('phone') ? trim($request->input('phone')) : null;
        }
        if ($request->has('dob')) {
            $user->dob = $request->input('dob');
        }
        if ($request->has('gender')) {
            $user->gender = $request->input('gender');
        }
        if ($request->has('address')) {
            $user->address = $request->input('address');
        }
        if ($request->has('city')) {
            $user->city = $request->input('city');
        }
        if ($request->has('state')) {
            $user->state = $request->input('state');
        }
        if ($request->has('country')) {
            $user->country = $request->input('country') ?: 'India';
        }
        if ($request->has('zip_code')) {
            $user->zip_code = $request->input('zip_code');
        }
        if ($request->has('bio')) {
            $user->bio = $request->input('bio');
        }

        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully!',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Upload and update user profile photo
     */
    public function uploadPhoto(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $fileKey = $request->hasFile('photo') ? 'photo' : ($request->hasFile('avatar') ? 'avatar' : null);

        if (!$fileKey) {
            return response()->json([
                'status' => 'error',
                'message' => 'Please select an image file to upload (photo or avatar field is required).',
                'errors' => [
                    'photo' => ['Please select an image file.'],
                ],
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            $fileKey => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ], [
            "{$fileKey}.image" => 'The uploaded file must be a valid image.',
            "{$fileKey}.mimes" => 'Allowed image formats are: JPEG, PNG, JPG, WEBP.',
            "{$fileKey}.max" => 'The image size may not exceed 5MB.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $uploadedFile = $request->file($fileKey);

        $uploadDir = public_path('uploads/avatars');
        if (!File::isDirectory($uploadDir)) {
            File::makeDirectory($uploadDir, 0755, true, true);
        }

        // Delete old custom avatar if previously saved in uploads/avatars/
        if (!empty($user->avatar) && str_starts_with($user->avatar, 'uploads/avatars/')) {
            $oldPath = public_path($user->avatar);
            if (File::exists($oldPath)) {
                @File::delete($oldPath);
            }
        }

        $ext = strtolower($uploadedFile->getClientOriginalExtension()) ?: 'png';
        $fileName = 'avatar_' . $user->id . '_' . time() . '_' . substr(uniqid(), 0, 6) . '.' . $ext;
        $uploadedFile->move($uploadDir, $fileName);

        $user->avatar = 'uploads/avatars/' . $fileName;
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Profile photo updated successfully!',
            'avatar' => $user->avatar,
            'avatar_url' => $user->avatar_url,
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Remove custom profile photo and revert to neutral initials
     */
    public function removePhoto(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!empty($user->avatar) && str_starts_with($user->avatar, 'uploads/avatars/')) {
            $oldPath = public_path($user->avatar);
            if (File::exists($oldPath)) {
                @File::delete($oldPath);
            }
        }

        $user->avatar = null;
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Profile photo removed successfully.',
            'avatar' => null,
            'avatar_url' => null,
            'user' => $user->fresh(),
        ]);
    }
}
