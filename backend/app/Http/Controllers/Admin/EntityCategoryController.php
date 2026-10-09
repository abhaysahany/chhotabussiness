<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EntityCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class EntityCategoryController extends Controller
{
    /**
     * Display a listing of entity categories with counts.
     */
    public function index()
    {
        $categories = EntityCategory::withCount(['businesses', 'freelancers'])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'badge_color' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $category = EntityCategory::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name) . '-' . time(),
            'description' => $request->description,
            'icon' => $request->icon ?? 'briefcase',
            'badge_color' => $request->badge_color ?? '#6366f1',
            'status' => $request->status ?? 'active',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Business Category created successfully',
            'category' => $category->loadCount(['businesses', 'freelancers']),
        ], 201);
    }

    /**
     * Display the specified category.
     */
    public function show($id)
    {
        $category = EntityCategory::withCount(['businesses', 'freelancers'])->find($id);

        if (!$category) {
            return response()->json(['status' => 'error', 'message' => 'Category not found'], 404);
        }

        return response()->json(['status' => 'success', 'category' => $category]);
    }

    /**
     * Update the specified category in storage.
     */
    public function update(Request $request, $id)
    {
        $category = EntityCategory::find($id);

        if (!$category) {
            return response()->json(['status' => 'error', 'message' => 'Category not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'badge_color' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $category->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name) . '-' . $category->id,
            'description' => $request->description,
            'icon' => $request->icon ?? $category->icon,
            'badge_color' => $request->badge_color ?? $category->badge_color,
            'status' => $request->status ?? $category->status,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Business Category updated successfully',
            'category' => $category->fresh()->loadCount(['businesses', 'freelancers']),
        ]);
    }

    /**
     * Remove the specified category.
     */
    public function destroy($id)
    {
        $category = EntityCategory::find($id);

        if (!$category) {
            return response()->json(['status' => 'error', 'message' => 'Category not found'], 404);
        }

        $category->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Category deleted successfully',
        ]);
    }
}
