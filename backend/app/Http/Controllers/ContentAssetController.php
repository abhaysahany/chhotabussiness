<?php

namespace App\Http\Controllers;

use App\Models\ContentAsset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;

class ContentAssetController extends Controller
{
    /**
     * Get Content Assets (Public / User Portal)
     */
    public function index(Request $request)
    {
        $query = ContentAsset::where('status', 'published');

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('entity_type') && $request->entity_type !== 'all') {
            $query->where('entity_type', $request->entity_type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%")
                  ->orWhere('entity_name', 'like', "%{$search}%")
                  ->orWhere('tags', 'like', "%{$search}%");
            });
        }

        $assets = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'assets' => $assets,
        ]);
    }

    /**
     * Get All Content Assets (Admin Management)
     */
    public function indexAdmin(Request $request)
    {
        $query = ContentAsset::query();

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('entity_type') && $request->entity_type !== 'all') {
            $query->where('entity_type', $request->entity_type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%")
                  ->orWhere('entity_name', 'like', "%{$search}%")
                  ->orWhere('tags', 'like', "%{$search}%");
            });
        }

        $assets = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'assets' => $assets,
        ]);
    }

    /**
     * Store New Content Asset into MySQL Database
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'type' => 'required|in:image,video,audio,pdf',
            'category' => 'required|string|max:255',
            'entity_type' => 'required|in:vyapar_adnet,chhota_business,business,freelance',
            'entity_name' => 'required|string|max:255',
            'tags' => 'required|string|max:255',
            'file' => 'nullable|file|max:51200', // max 50MB
            'file_url' => 'nullable|string|max:2000',
            'status' => 'nullable|in:published,draft',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Validate content file type matches declared content type
        $typeError = $this->validateFileType($request);
        if ($typeError) {
            return response()->json([
                'status' => 'error',
                'message' => $typeError,
                'errors' => [
                    'file' => [$typeError],
                ],
            ], 422);
        }

        // Must provide either uploaded file or external file_url
        if (!$request->hasFile('file') && empty($request->file_url)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Please either upload a media file from your computer or provide an external image/media link.',
            ], 422);
        }

        $fileUrl = $request->file_url;
        $thumbnailUrl = $request->thumbnail ?? null;

        // Handle uploaded file from computer
        if ($request->hasFile('file')) {
            $uploadedFile = $request->file('file');
            $uploadDir = public_path('uploads/content_assets');

            if (!File::isDirectory($uploadDir)) {
                File::makeDirectory($uploadDir, 0755, true, true);
            }

            $fileName = time() . '_' . uniqid() . '.' . $uploadedFile->getClientOriginalExtension();
            $uploadedFile->move($uploadDir, $fileName);
            $fileUrl = url('uploads/content_assets/' . $fileName);

            if ($request->type === 'image' || in_array(strtolower($uploadedFile->getClientOriginalExtension()), ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
                $thumbnailUrl = $fileUrl;
            }
        }

        if (empty($thumbnailUrl)) {
            $thumbnailUrl = $fileUrl;
        }

        $asset = ContentAsset::create([
            'title' => $request->title,
            'type' => $request->type,
            'category' => $request->category,
            'entity_type' => $request->entity_type,
            'entity_name' => $request->entity_name,
            'file_url' => $fileUrl,
            'thumbnail' => $thumbnailUrl,
            'tags' => $request->tags,
            'downloads' => 0,
            'shares' => 0,
            'status' => $request->status ?? 'published',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Content asset uploaded and saved to database successfully!',
            'asset' => $asset,
        ], 201);
    }

    /**
     * Update Content Asset
     */
    public function update(Request $request, $id)
    {
        $asset = ContentAsset::find($id);

        if (!$asset) {
            return response()->json([
                'status' => 'error',
                'message' => 'Content asset not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'type' => 'required|in:image,video,audio,pdf',
            'category' => 'required|string|max:255',
            'entity_type' => 'required|in:vyapar_adnet,chhota_business,business,freelance',
            'entity_name' => 'required|string|max:255',
            'tags' => 'required|string|max:255',
            'file' => 'nullable|file|max:51200',
            'file_url' => 'nullable|string|max:2000',
            'status' => 'nullable|in:published,draft',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Validate content file type matches declared content type
        $typeError = $this->validateFileType($request);
        if ($typeError) {
            return response()->json([
                'status' => 'error',
                'message' => $typeError,
                'errors' => [
                    'file' => [$typeError],
                ],
            ], 422);
        }

        $fileUrl = $request->file_url ?? $asset->file_url;
        $thumbnailUrl = $request->thumbnail ?? $asset->thumbnail;

        if ($request->hasFile('file')) {
            $uploadedFile = $request->file('file');
            $uploadDir = public_path('uploads/content_assets');

            if (!File::isDirectory($uploadDir)) {
                File::makeDirectory($uploadDir, 0755, true, true);
            }

            $fileName = time() . '_' . uniqid() . '.' . $uploadedFile->getClientOriginalExtension();
            $uploadedFile->move($uploadDir, $fileName);
            $fileUrl = url('uploads/content_assets/' . $fileName);
            $thumbnailUrl = $fileUrl;
        }

        $asset->update([
            'title' => $request->title,
            'type' => $request->type,
            'category' => $request->category,
            'entity_type' => $request->entity_type,
            'entity_name' => $request->entity_name,
            'file_url' => $fileUrl,
            'thumbnail' => $thumbnailUrl,
            'tags' => $request->tags,
            'status' => $request->status ?? $asset->status,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Content asset updated successfully!',
            'asset' => $asset,
        ]);
    }

    /**
     * Delete Content Asset from Database
     */
    public function destroy($id)
    {
        $asset = ContentAsset::find($id);

        if (!$asset) {
            return response()->json([
                'status' => 'error',
                'message' => 'Content asset not found.',
            ], 404);
        }

        $asset->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Content asset deleted successfully from database!',
        ]);
    }

    /**
     * Increment Download Count in Database
     */
    public function trackDownload($id)
    {
        $asset = ContentAsset::find($id);
        if ($asset) {
            $asset->increment('downloads');
        }

        return response()->json([
            'status' => 'success',
            'downloads' => $asset ? $asset->downloads : 0,
        ]);
    }

    /**
     * Increment Share Count in Database
     */
    public function trackShare($id)
    {
        $asset = ContentAsset::find($id);
        if ($asset) {
            $asset->increment('shares');
        }

        return response()->json([
            'status' => 'success',
            'shares' => $asset ? $asset->shares : 0,
        ]);
    }

    /**
     * Download and save real media file to user's computer or mobile
     */
    public function downloadFile($id)
    {
        $asset = ContentAsset::find($id);
        if (!$asset) {
            return response()->json(['error' => 'Asset not found'], 404);
        }

        $asset->increment('downloads');

        // Check if file is stored locally in public/uploads/content_assets
        if (str_contains($asset->file_url, 'uploads/content_assets/')) {
            $parsed = parse_url($asset->file_url, PHP_URL_PATH);
            $localPath = public_path(ltrim($parsed, '/'));
            if (file_exists($localPath)) {
                $ext = pathinfo($localPath, PATHINFO_EXTENSION) ?: 'jpg';
                $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $asset->title) . '.' . $ext;
                return response()->download($localPath, $safeName);
            }
        }

        // For external URLs, fetch content and return as attachment stream
        try {
            $content = @file_get_contents($asset->file_url);
            if ($content !== false) {
                $ext = match ($asset->type) {
                    'video' => 'mp4',
                    'audio' => 'mp3',
                    'pdf' => 'pdf',
                    default => 'jpg',
                };
                $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $asset->title) . '.' . $ext;
                return response($content, 200, [
                    'Content-Type' => 'application/octet-stream',
                    'Content-Disposition' => 'attachment; filename="' . $safeName . '"',
                ]);
            }
        } catch (\Exception $e) {
            // fallback
        }

        return redirect($asset->file_url);
    }

    /**
     * Validate content file against the declared content type.
     */
    private function validateFileType(Request $request): ?string
    {
        if ($request->hasFile('file')) {
            $uploadedFile = $request->file('file');
            $mime = strtolower($uploadedFile->getMimeType() ?? '');
            $ext = strtolower($uploadedFile->getClientOriginalExtension() ?? '');

            $isImage = str_starts_with($mime, 'image/') || in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp']);
            $isVideo = str_starts_with($mime, 'video/') || in_array($ext, ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', '3gp', 'flv']);
            $isAudio = str_starts_with($mime, 'audio/') || in_array($ext, ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac']);
            $isPdf = $mime === 'application/pdf' || $ext === 'pdf';

            if ($request->type === 'video' && !$isVideo) {
                return 'Please, your selection is video. Please change this content.';
            }

            if ($request->type === 'image' && !$isImage) {
                return 'Please, your selection is image. Please change this content.';
            }

            if ($request->type === 'audio' && !$isAudio) {
                return 'Please, your selection is audio. Please change this content.';
            }

            if ($request->type === 'pdf' && !$isPdf) {
                return 'Please, your selection is pdf. Please change this content.';
            }
        } elseif (!empty($request->file_url)) {
            $path = parse_url($request->file_url, PHP_URL_PATH);
            $urlExt = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            if ($urlExt) {
                $isUrlImage = in_array($urlExt, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp']);
                $isUrlVideo = in_array($urlExt, ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', '3gp', 'flv']);
                $isUrlAudio = in_array($urlExt, ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac']);
                $isUrlPdf = $urlExt === 'pdf';

                if ($request->type === 'video' && $isUrlImage) {
                    return 'Please, your selection is video. Please change this content.';
                }
                if ($request->type === 'image' && $isUrlVideo) {
                    return 'Please, your selection is image. Please change this content.';
                }
                if ($request->type === 'audio' && ($isUrlImage || $isUrlVideo || $isUrlPdf)) {
                    return 'Please, your selection is audio. Please change this content.';
                }
                if ($request->type === 'pdf' && ($isUrlImage || $isUrlVideo || $isUrlAudio)) {
                    return 'Please, your selection is pdf. Please change this content.';
                }
            }
        }

        return null;
    }
}
