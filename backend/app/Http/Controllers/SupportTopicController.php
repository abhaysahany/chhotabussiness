<?php

namespace App\Http\Controllers;

use App\Models\SupportTopic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SupportTopicController extends Controller
{
    /**
     * Helper to format Youtube URLs into Embed format if needed
     */
    private function formatYoutubeUrl($url)
    {
        if (!$url) return null;
        $url = trim($url);
        if (str_contains($url, 'watch?v=')) {
            return preg_replace('/watch\?v=([a-zA-Z0-9_-]+)/', 'embed/$1', $url);
        }
        if (str_contains($url, 'youtu.be/')) {
            return preg_replace('/youtu\.be\/([a-zA-Z0-9_-]+)/', 'youtube.com/embed/$1', $url);
        }
        return $url;
    }

    /**
     * Get Published Support Topics (User Portal / Public)
     */
    public function index(Request $request)
    {
        $query = SupportTopic::where('status', 'published');

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%")
                  ->orWhere('summary', 'like', "%{$search}%")
                  ->orWhere('article_body', 'like', "%{$search}%")
                  ->orWhere('faq_question', 'like', "%{$search}%")
                  ->orWhere('faq_answer', 'like', "%{$search}%");
            });
        }

        $topics = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'topics' => $topics,
        ]);
    }

    /**
     * Get All Support Topics (Admin Management)
     */
    public function indexAdmin(Request $request)
    {
        $query = SupportTopic::query();

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%")
                  ->orWhere('summary', 'like', "%{$search}%")
                  ->orWhere('article_body', 'like', "%{$search}%")
                  ->orWhere('faq_question', 'like', "%{$search}%")
                  ->orWhere('faq_answer', 'like', "%{$search}%");
            });
        }

        $topics = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'topics' => $topics,
        ]);
    }

    /**
     * Store New Support Video & Article into MySQL Database
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'youtube_url' => 'nullable|string|max:1000',
            'thumbnail' => 'nullable|string|max:2000',
            'summary' => 'nullable|string',
            'article_body' => 'nullable|string',
            'faq_question' => 'nullable|string',
            'faq_answer' => 'nullable|string',
            'status' => 'nullable|in:published,draft',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $youtubeUrl = $this->formatYoutubeUrl($request->input('youtube_url'));

        $topic = SupportTopic::create([
            'title' => $request->title,
            'category' => $request->category ?? 'Update Content',
            'youtube_url' => $youtubeUrl,
            'thumbnail' => $request->thumbnail ?? 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500',
            'summary' => $request->summary,
            'article_body' => $request->article_body,
            'faq_question' => $request->faq_question,
            'faq_answer' => $request->faq_answer,
            'views' => 0,
            'helpful_count' => 0,
            'status' => $request->status ?? 'published',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Support video & article uploaded and published to database successfully!',
            'topic' => $topic,
        ], 201);
    }

    /**
     * Get Single Support Topic
     */
    public function show($id)
    {
        $topic = SupportTopic::find($id);

        if (!$topic) {
            return response()->json([
                'status' => 'error',
                'message' => 'Support topic not found',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'topic' => $topic,
        ]);
    }

    /**
     * Update Support Topic in MySQL Database
     */
    public function update(Request $request, $id)
    {
        $topic = SupportTopic::find($id);

        if (!$topic) {
            return response()->json([
                'status' => 'error',
                'message' => 'Support topic not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'youtube_url' => 'nullable|string|max:1000',
            'thumbnail' => 'nullable|string|max:2000',
            'summary' => 'nullable|string',
            'article_body' => 'nullable|string',
            'faq_question' => 'nullable|string',
            'faq_answer' => 'nullable|string',
            'status' => 'nullable|in:published,draft',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $youtubeUrl = $this->formatYoutubeUrl($request->input('youtube_url'));

        $topic->update([
            'title' => $request->title,
            'category' => $request->category,
            'youtube_url' => $youtubeUrl,
            'thumbnail' => $request->thumbnail ?? $topic->thumbnail,
            'summary' => $request->summary,
            'article_body' => $request->article_body,
            'faq_question' => $request->faq_question,
            'faq_answer' => $request->faq_answer,
            'status' => $request->status ?? $topic->status,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Support topic updated successfully in database!',
            'topic' => $topic,
        ]);
    }

    /**
     * Toggle / Update Status (published / draft)
     */
    public function updateStatus(Request $request, $id)
    {
        $topic = SupportTopic::find($id);

        if (!$topic) {
            return response()->json([
                'status' => 'error',
                'message' => 'Support topic not found',
            ], 404);
        }

        $newStatus = $request->input('status');
        if (!$newStatus) {
            $newStatus = $topic->status === 'published' ? 'draft' : 'published';
        }

        $topic->update(['status' => $newStatus]);

        return response()->json([
            'status' => 'success',
            'message' => "Support topic status updated to {$newStatus}!",
            'topic' => $topic,
        ]);
    }

    /**
     * Delete Support Topic from Database
     */
    public function destroy($id)
    {
        $topic = SupportTopic::find($id);

        if (!$topic) {
            return response()->json([
                'status' => 'error',
                'message' => 'Support topic not found',
            ], 404);
        }

        $topic->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Support topic deleted successfully from database!',
        ]);
    }

    /**
     * Increment View Count
     */
    public function incrementView($id)
    {
        $topic = SupportTopic::find($id);
        if ($topic) {
            $topic->increment('views');
        }

        return response()->json([
            'status' => 'success',
            'views' => $topic ? $topic->views : 0,
        ]);
    }

    /**
     * Vote Helpful
     */
    public function voteHelpful($id)
    {
        $topic = SupportTopic::find($id);
        if ($topic) {
            $topic->increment('helpful_count');
        }

        return response()->json([
            'status' => 'success',
            'helpful_count' => $topic ? $topic->helpful_count : 0,
        ]);
    }
}
