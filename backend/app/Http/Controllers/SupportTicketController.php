<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use App\Models\SupportMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SupportTicketController extends Controller
{
    /**
     * Get tickets for current user from MySQL database
     */
    public function getUserTickets(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && $request->filled('user_code')) {
            $user = User::where('user_code', $request->input('user_code'))->first();
        }
        if (!$user && $request->filled('user_id')) {
            $user = User::find($request->input('user_id'));
        }

        $query = SupportTicket::with(['messages' => function ($q) {
            $q->orderBy('created_at', 'asc');
        }]);

        if ($user) {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('user_email', $user->email)
                  ->orWhere('user_name', $user->name);
            });
        }

        // Seed initial tickets if database has none for this user
        if ($user && $query->count() === 0) {
            $this->seedInitialUserTickets($user);
        }

        if ($request->filled('status') && $request->input('status') !== 'All') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('category') && $request->input('category') !== 'All') {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('subject', 'like', "%{$s}%")
                  ->orWhere('ticket_code', 'like', "%{$s}%")
                  ->orWhere('category', 'like', "%{$s}%");
            });
        }

        $tickets = $query->orderBy('updated_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'tickets' => $tickets,
        ]);
    }

    /**
     * Create a new support ticket in database
     */
    public function createTicket(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && $request->filled('user_code')) {
            $user = User::where('user_code', $request->input('user_code'))->first();
        }
        if (!$user && $request->filled('user_id')) {
            $user = User::find($request->input('user_id'));
        }

        $validator = Validator::make($request->all(), [
            'subject' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'priority' => 'nullable|in:Low,Medium,High,Urgent',
            'description' => 'required|string|min:5',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $customCategory = $request->input('custom_category');
        $category = $request->input('category');
        if ($category === 'Others' && !empty($customCategory)) {
            $category = "Others: " . trim($customCategory);
        }

        $userId = $user ? $user->id : 1;
        $userName = $user ? $user->name : ($request->input('user_name') ?: 'Registered Member');
        $userEmail = $user ? $user->email : ($request->input('user_email') ?: 'member@vyaparadnet.com');

        DB::beginTransaction();
        try {
            $nextId = (SupportTicket::max('id') ?? 0) + 101;
            $ticketCode = 'TK-' . date('Y') . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

            $ticket = SupportTicket::create([
                'ticket_code' => $ticketCode,
                'user_id' => $userId,
                'user_name' => $userName,
                'user_email' => $userEmail,
                'subject' => trim($request->input('subject')),
                'category' => $category,
                'priority' => $request->input('priority') ?: 'Medium',
                'status' => 'Open',
            ]);

            SupportMessage::create([
                'ticket_id' => $ticket->id,
                'sender_type' => 'user',
                'sender_name' => $userName,
                'message' => trim($request->input('description')),
                'attachment' => $request->input('attachment') ?: null,
            ]);

            DB::commit();

            $freshTicket = SupportTicket::with('messages')->find($ticket->id);

            return response()->json([
                'status' => 'success',
                'message' => "✓ Support ticket {$ticketCode} created successfully in database!",
                'ticket' => $freshTicket,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create support ticket: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * User / Admin Reply to an existing ticket
     */
    public function replyTicket(Request $request, $id)
    {
        $ticket = SupportTicket::find($id);
        if (!$ticket) {
            return response()->json(['status' => 'error', 'message' => 'Support ticket not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'message' => 'required|string|min:2',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => $validator->errors()->first()], 422);
        }

        $user = auth('sanctum')->user() ?: $request->user();
        $senderType = $request->input('sender_type') ?: ($user ? 'user' : 'user');
        $senderName = $request->input('sender_name') ?: ($user ? $user->name : 'Member');

        $message = SupportMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => $senderType,
            'sender_name' => $senderName,
            'message' => trim($request->input('message')),
            'attachment' => $request->input('attachment') ?: null,
        ]);

        if ($senderType === 'admin') {
            $ticket->status = 'In Progress';
        } elseif ($ticket->status === 'Resolved' || $ticket->status === 'Closed') {
            $ticket->status = 'Open';
        }
        $ticket->touch();

        $freshTicket = SupportTicket::with('messages')->find($ticket->id);

        return response()->json([
            'status' => 'success',
            'message' => '✓ Message posted successfully!',
            'ticket' => $freshTicket,
        ]);
    }

    /**
     * Update ticket status (Resolve / Close)
     */
    public function updateStatus(Request $request, $id)
    {
        $ticket = SupportTicket::find($id);
        if (!$ticket) {
            return response()->json(['status' => 'error', 'message' => 'Ticket not found.'], 404);
        }

        $status = $request->input('status');
        if (!in_array($status, ['Open', 'In Progress', 'Resolved', 'Closed'])) {
            return response()->json(['status' => 'error', 'message' => 'Invalid status value.'], 422);
        }

        $ticket->status = $status;
        $ticket->save();

        $freshTicket = SupportTicket::with('messages')->find($ticket->id);

        return response()->json([
            'status' => 'success',
            'message' => "✓ Ticket {$ticket->ticket_code} status updated to {$status}!",
            'ticket' => $freshTicket,
        ]);
    }

    /**
     * Admin: List all tickets in system
     */
    public function getAdminTickets(Request $request)
    {
        $query = SupportTicket::with(['messages' => function ($q) {
            $q->orderBy('created_at', 'asc');
        }]);

        if ($request->filled('status') && $request->input('status') !== 'All') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('category') && $request->input('category') !== 'All') {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('subject', 'like', "%{$s}%")
                  ->orWhere('ticket_code', 'like', "%{$s}%")
                  ->orWhere('user_name', 'like', "%{$s}%")
                  ->orWhere('user_email', 'like', "%{$s}%");
            });
        }

        $tickets = $query->orderBy('updated_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'tickets' => $tickets,
        ]);
    }

    /**
     * Seed initial tickets for a user if empty
     */
    private function seedInitialUserTickets($user)
    {
        $t1 = SupportTicket::create([
            'ticket_code' => 'TK-2026-1001',
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'subject' => 'Commission Wallet Settlement & Bank Transfer Inquiry',
            'category' => 'Commission, Wallet & Withdrawals',
            'priority' => 'High',
            'status' => 'In Progress',
        ]);

        SupportMessage::create([
            'ticket_id' => $t1->id,
            'sender_type' => 'user',
            'sender_name' => $user->name,
            'message' => 'Hello Support Team, I submitted a payout withdrawal request to my primary bank account. Could you please confirm the processing status and UTR number?',
        ]);

        SupportMessage::create([
            'ticket_id' => $t1->id,
            'sender_type' => 'admin',
            'sender_name' => 'Support Desk Lead',
            'message' => "Hello {$user->name}, your payout request has been received and verified. The banking batch is queued for settlement and funds will reflect in your account within 2 hours.",
        ]);

        $t2 = SupportTicket::create([
            'ticket_code' => 'TK-2026-1002',
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'subject' => 'KYC Identification Verification Confirmation',
            'category' => 'KYC Verification (PAN / Aadhaar)',
            'priority' => 'Medium',
            'status' => 'Resolved',
        ]);

        SupportMessage::create([
            'ticket_id' => $t2->id,
            'sender_type' => 'user',
            'sender_name' => $user->name,
            'message' => 'I have uploaded my PAN Card and 12-digit Aadhaar UID front and back photos. Please verify my KYC.',
        ]);

        SupportMessage::create([
            'ticket_id' => $t2->id,
            'sender_type' => 'admin',
            'sender_name' => 'KYC Compliance Admin',
            'message' => "Your PAN & Aadhaar documents have been audited and verified. Your KYC status is active and Payout Accounts are unlocked.",
        ]);
    }
}
