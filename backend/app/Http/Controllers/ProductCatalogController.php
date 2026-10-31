<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Service;
use App\Models\ProductPackage;
use App\Models\EntityCommissionSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductCatalogController extends Controller
{
    // ==========================================
    // PRODUCTS API
    // ==========================================

    public function indexProducts(Request $request)
    {
        $query = Product::query();

        if ($request->has('category') && $request->category !== 'all' && !empty($request->category)) {
            $query->where('category', $request->category);
        }

        if ($request->has('owner_type') && $request->owner_type !== 'all' && !empty($request->owner_type)) {
            $query->where('owner_type', $request->owner_type);
        }

        if ($request->has('status') && $request->status !== 'all' && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('owner_name', 'like', $search)
                  ->orWhere('sku', 'like', $search)
                  ->orWhere('category', 'like', $search);
            });
        }

        $products = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'products' => $products,
        ]);
    }

    public function storeProduct(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'nullable|string',
            'owner_type' => 'nullable|string',
            'owner_name' => 'nullable|string',
            'admin_commission_percent' => 'nullable|numeric|min:0|max:100',
            'stock' => 'nullable|integer|min:0',
            'sku' => 'nullable|string',
            'status' => 'nullable|string',
            'description' => 'nullable|string',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
        ]);

        $imageUrl = $request->input('image');

        if ($request->hasFile('image_file')) {
            $file = $request->file('image_file');
            $filename = 'product_' . time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/catalog');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $file->move($destinationPath, $filename);
            $imageUrl = url('uploads/catalog/' . $filename);
        }

        if (!$imageUrl) {
            $imageUrl = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80';
        }

        $ownerType = $request->input('owner_type') ?: 'business';
        $ownerName = $request->input('owner_name') ?: 'Skyline Technologies Pvt Ltd';
        $commissionConfig = EntityCommissionSetting::resolveForEntity($ownerType, $ownerName);

        $adminCommissionPercent = $commissionConfig['total_commission_percent'];
        if ($request->filled('admin_commission_percent') && is_numeric($request->input('admin_commission_percent'))) {
            $val = (float) $request->input('admin_commission_percent');
            if ($val >= 0 && $val <= 100) {
                $adminCommissionPercent = $val;
            }
        }

        $product = Product::create([
            'name' => $request->input('name'),
            'category' => $request->input('category') ?: 'Software & IT',
            'owner_type' => $ownerType,
            'owner_name' => $ownerName,
            'price' => $request->input('price'),
            'admin_commission_percent' => $adminCommissionPercent,
            'stock' => $request->input('stock') !== null ? $request->input('stock') : 50,
            'sku' => $request->input('sku') ?: ('SKU-' . strtoupper(Str::random(6))),
            'status' => $request->input('status') ?: 'active',
            'image' => $imageUrl,
            'description' => $request->input('description'),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Product successfully created in MySQL database.',
            'product' => $product,
        ], 201);
    }

    public function updateProduct(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'nullable|string',
            'owner_type' => 'nullable|string',
            'owner_name' => 'nullable|string',
            'admin_commission_percent' => 'nullable|numeric|min:0|max:100',
            'stock' => 'nullable|integer|min:0',
            'sku' => 'nullable|string',
            'status' => 'nullable|string',
            'description' => 'nullable|string',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
        ]);

        $imageUrl = $product->image;

        if ($request->hasFile('image_file')) {
            $file = $request->file('image_file');
            $filename = 'product_' . time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/catalog');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $file->move($destinationPath, $filename);
            $imageUrl = url('uploads/catalog/' . $filename);
        } elseif ($request->filled('image')) {
            $imageUrl = $request->input('image');
        }

        $ownerType = $request->input('owner_type') ?: $product->owner_type;
        $ownerName = $request->input('owner_name') ?: $product->owner_name;
        $commissionConfig = EntityCommissionSetting::resolveForEntity($ownerType, $ownerName);

        $adminCommissionPercent = $product->admin_commission_percent;
        if ($request->filled('admin_commission_percent') && is_numeric($request->input('admin_commission_percent'))) {
            $val = (float) $request->input('admin_commission_percent');
            if ($val >= 0 && $val <= 100) {
                $adminCommissionPercent = $val;
            }
        } elseif ($commissionConfig['is_custom']) {
            $adminCommissionPercent = $commissionConfig['total_commission_percent'];
        }

        $product->update([
            'name' => $request->input('name'),
            'category' => $request->input('category') ?: $product->category,
            'owner_type' => $ownerType,
            'owner_name' => $ownerName,
            'price' => $request->input('price'),
            'admin_commission_percent' => $adminCommissionPercent,
            'stock' => $request->input('stock') !== null ? $request->input('stock') : $product->stock,
            'sku' => $request->input('sku') ?: $product->sku,
            'status' => $request->input('status') ?: $product->status,
            'image' => $imageUrl,
            'description' => $request->input('description') !== null ? $request->input('description') : $product->description,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Product updated successfully.',
            'product' => $product,
        ]);
    }

    public function destroyProduct($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Product removed from database.',
        ]);
    }

    // ==========================================
    // SERVICES API
    // ==========================================

    public function indexServices(Request $request)
    {
        $query = Service::query();

        if ($request->has('category') && $request->category !== 'all' && !empty($request->category)) {
            $query->where('category', $request->category);
        }

        if ($request->has('owner_type') && $request->owner_type !== 'all' && !empty($request->owner_type)) {
            $query->where('owner_type', $request->owner_type);
        }

        if ($request->has('status') && $request->status !== 'all' && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('owner_name', 'like', $search)
                  ->orWhere('category', 'like', $search);
            });
        }

        $services = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'services' => $services,
        ]);
    }

    public function storeService(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'nullable|string',
            'owner_type' => 'nullable|string',
            'owner_name' => 'nullable|string',
            'admin_commission_percent' => 'nullable|numeric|min:0|max:100',
            'duration' => 'nullable|string',
            'status' => 'nullable|string',
            'description' => 'nullable|string',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
        ]);

        $imageUrl = $request->input('image');

        if ($request->hasFile('image_file')) {
            $file = $request->file('image_file');
            $filename = 'service_' . time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/catalog');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $file->move($destinationPath, $filename);
            $imageUrl = url('uploads/catalog/' . $filename);
        }

        if (!$imageUrl) {
            $imageUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80';
        }

        $ownerType = $request->input('owner_type') ?: 'business';
        $ownerName = $request->input('owner_name') ?: 'ChhotaBusiness Tax Advisory';
        $commissionConfig = EntityCommissionSetting::resolveForEntity($ownerType, $ownerName);

        $adminCommissionPercent = $commissionConfig['total_commission_percent'];
        if ($request->filled('admin_commission_percent') && is_numeric($request->input('admin_commission_percent'))) {
            $val = (float) $request->input('admin_commission_percent');
            if ($val >= 0 && $val <= 100) {
                $adminCommissionPercent = $val;
            }
        }

        $service = Service::create([
            'name' => $request->input('name'),
            'category' => $request->input('category') ?: 'Legal & Compliance',
<<<<<<< HEAD
            'owner_type' => $request->input('owner_type') ?: 'business',
            'owner_name' => $request->input('owner_name') ?: 'Vyapar Adnet Tax Advisory',
=======
            'owner_type' => $ownerType,
            'owner_name' => $ownerName,
>>>>>>> fb58c420080770de6eee6f2a63280e24ca568f13
            'price' => $request->input('price'),
            'admin_commission_percent' => $adminCommissionPercent,
            'duration' => $request->input('duration') ?: '3 Business Days',
            'status' => $request->input('status') ?: 'active',
            'image' => $imageUrl,
            'description' => $request->input('description'),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Service successfully created in MySQL database.',
            'service' => $service,
        ], 201);
    }

    public function updateService(Request $request, $id)
    {
        $service = Service::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'nullable|string',
            'owner_type' => 'nullable|string',
            'owner_name' => 'nullable|string',
            'admin_commission_percent' => 'nullable|numeric|min:0|max:100',
            'duration' => 'nullable|string',
            'status' => 'nullable|string',
            'description' => 'nullable|string',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
        ]);

        $imageUrl = $service->image;

        if ($request->hasFile('image_file')) {
            $file = $request->file('image_file');
            $filename = 'service_' . time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/catalog');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $file->move($destinationPath, $filename);
            $imageUrl = url('uploads/catalog/' . $filename);
        } elseif ($request->filled('image')) {
            $imageUrl = $request->input('image');
        }

        $ownerType = $request->input('owner_type') ?: $service->owner_type;
        $ownerName = $request->input('owner_name') ?: $service->owner_name;
        $commissionConfig = EntityCommissionSetting::resolveForEntity($ownerType, $ownerName);

        $adminCommissionPercent = $service->admin_commission_percent;
        if ($request->filled('admin_commission_percent') && is_numeric($request->input('admin_commission_percent'))) {
            $val = (float) $request->input('admin_commission_percent');
            if ($val >= 0 && $val <= 100) {
                $adminCommissionPercent = $val;
            }
        } elseif ($commissionConfig['is_custom']) {
            $adminCommissionPercent = $commissionConfig['total_commission_percent'];
        }

        $service->update([
            'name' => $request->input('name'),
            'category' => $request->input('category') ?: $service->category,
            'owner_type' => $ownerType,
            'owner_name' => $ownerName,
            'price' => $request->input('price'),
            'admin_commission_percent' => $adminCommissionPercent,
            'duration' => $request->input('duration') ?: $service->duration,
            'status' => $request->input('status') ?: $service->status,
            'image' => $imageUrl,
            'description' => $request->input('description') !== null ? $request->input('description') : $service->description,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Service updated successfully.',
            'service' => $service,
        ]);
    }

    public function destroyService($id)
    {
        $service = Service::findOrFail($id);
        $service->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Service removed from database.',
        ]);
    }

    // ==========================================
    // CATEGORIES API
    // ==========================================

    public function indexCategories()
    {
        $categories = Category::where('status', 'active')->get();
        return response()->json([
            'status' => 'success',
            'categories' => $categories,
        ]);
    }

    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string',
        ]);

        $category = Category::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'type' => $request->type ?: 'both',
            'status' => 'active',
        ]);

        return response()->json([
            'status' => 'success',
            'category' => $category,
        ]);
    }

    // ==========================================
    // PACKAGES API (MySQL Database Backed)
    // ==========================================

    public function indexPackages(Request $request)
    {
        $packages = ProductPackage::orderBy('id', 'desc')->get();

        if ($packages->isEmpty()) {
            $defaultPackages = [
                [
                    'name' => 'Startup Launchpad Bundle (Web + App + Cloud)',
                    'price' => 45000.00,
                    'commission_percent' => 22.00,
                    'description' => 'Comprehensive multi-platform architecture stack with cloud provisioning.',
                    'items_included' => ['Full-Stack Web App', 'Cross-platform Mobile App', 'Cloud Setup'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Digital Growth & Social Commerce Kit',
                    'price' => 12000.00,
                    'commission_percent' => 15.00,
                    'description' => 'Automated marketing funnels, WhatsApp store integration and creative assets.',
                    'items_included' => ['Social Ad Templates', 'WhatsApp Commerce Bot', 'Catalog Setup'],
                    'status' => 'active',
                ],
                [
                    'name' => 'Enterprise E-Commerce Suite',
                    'price' => 75000.00,
                    'commission_percent' => 25.00,
                    'description' => 'Enterprise B2B/B2C storefront with multi-warehouse inventory and payment routes.',
                    'items_included' => ['Custom Payment Gateway', 'Multi-vendor Portal', 'Inventory System'],
                    'status' => 'active',
                ],
            ];

            foreach ($defaultPackages as $pkg) {
                ProductPackage::create($pkg);
            }

            $packages = ProductPackage::orderBy('id', 'desc')->get();
        }

        return response()->json([
            'status' => 'success',
            'packages' => $packages,
        ]);
    }

    public function storePackage(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'commission_percent' => 'nullable|numeric|min:0|max:100',
            'description' => 'nullable|string',
            'items_included' => 'nullable|array',
            'status' => 'nullable|string',
        ]);

        $package = ProductPackage::create([
            'name' => $request->input('name'),
            'price' => $request->input('price'),
            'commission_percent' => $request->input('commission_percent') !== null ? $request->input('commission_percent') : 18.00,
            'description' => $request->input('description'),
            'items_included' => $request->input('items_included') ?: [],
            'status' => $request->input('status') ?: 'active',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Package successfully created in database.',
            'package' => $package,
        ], 201);
    }

    public function updatePackage(Request $request, $id)
    {
        $package = ProductPackage::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'commission_percent' => 'nullable|numeric|min:0|max:100',
            'description' => 'nullable|string',
            'items_included' => 'nullable|array',
            'status' => 'nullable|string',
        ]);

        $package->update([
            'name' => $request->input('name'),
            'price' => $request->input('price'),
            'commission_percent' => $request->input('commission_percent') !== null ? $request->input('commission_percent') : $package->commission_percent,
            'description' => $request->input('description') !== null ? $request->input('description') : $package->description,
            'items_included' => $request->input('items_included') ?: $package->items_included,
            'status' => $request->input('status') ?: $package->status,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Package updated successfully in database.',
            'package' => $package,
        ]);
    }

    public function destroyPackage($id)
    {
        $package = ProductPackage::findOrFail($id);
        $package->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Package removed from database.',
        ]);
    }
}

