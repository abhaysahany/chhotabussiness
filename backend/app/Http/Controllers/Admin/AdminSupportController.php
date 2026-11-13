<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminSupportController extends Controller
{
    /**
     * Get list of support tickets with filters
     */
    public function index(Request $request)
    {
        $query = SupportTicket::with('messages')->orderBy('updated_at', 'desc');

        if ($request->has('status') && $request->status !== 'All') {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && !empty($request->search)) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('ticket_code', 'like', "%{$searchTerm}%")
                  ->orWhere('subject', 'like', "%{$searchTerm}%")
                  ->orWhere('user_name', 'like', "%{$searchTerm}%")
                  ->orWhere('user_email', 'like', "%{$searchTerm}%");
            });
        }

        $tickets = $query->get();

        return response()->json([
            'status' => 'success',
            'tickets' => $tickets,
            'stats' => [
                'total' => SupportTicket::count(),
                'open' => SupportTicket::where('status', 'Open')->count(),
                'in_progress' => SupportTicket::where('status', 'In Progress')->count(),
                'resolved' => SupportTicket::where('status', 'Resolved')->count(),
            ],
        ]);
    }

    /**
     * Get single support ticket details
     */
    public function show($id)
    {
        $ticket = SupportTicket::with('messages')->find($id);

        if (!$ticket) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ticket not found',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'ticket' => $ticket,
        ]);
    }

    /**
     * Post Admin Reply to Ticket
     */
    public function reply(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string',
            'admin_name' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Message is required',
            ], 422);
        }

        $ticket = SupportTicket::find($id);

        if (!$ticket) {
            return response()->json([
                'status' => 'error',
                'message' => 'Support ticket not found',
            ], 404);
        }

        // Create Admin Message
        $message = SupportMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => 'admin',
            'sender_name' => $request->admin_name ?? 'Senior Admin Support',
            'message' => $request->message,
        ]);

        // Auto update status if open
        if ($ticket->status === 'Open') {
            $ticket->update(['status' => 'In Progress']);
        } else {
            $ticket->touch(); // Update timestamp
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Admin reply dispatched successfully!',
            'ticket' => $ticket->load('messages'),
        ]);
    }

    /**
     * Update Ticket Status
     */
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:Open,In Progress,Resolved,Closed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid ticket status value',
            ], 422);
        }

        $ticket = SupportTicket::find($id);

        if (!$ticket) {
            return response()->json([
                'status' => 'error',
                'message' => 'Support ticket not found',
            ], 404);
        }

        $ticket->update(['status' => $request->status]);

        return response()->json([
            'status' => 'success',
            'message' => "Ticket status updated to {$request->status}",
            'ticket' => $ticket->load('messages'),
        ]);
    }

    /**
     * Create Support Ticket (User/Public submission)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_name' => 'required|string',
            'user_email' => 'required|email',
            'subject' => 'required|string',
            'category' => 'nullable|string',
            'message' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $ticketCode = 'TCK-' . rand(1000, 9999);

        $ticket = SupportTicket::create([
            'ticket_code' => $ticketCode,
            'user_name' => $request->user_name,
            'user_email' => $request->user_email,
            'subject' => $request->subject,
            'category' => $request->category ?? 'General',
            'status' => 'Open',
        ]);

        SupportMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => 'user',
            'sender_name' => $request->user_name,
            'message' => $request->message,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Support ticket created successfully!',
            'ticket' => $ticket->load('messages'),
        ], 201);
    }
}
