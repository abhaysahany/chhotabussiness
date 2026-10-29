<?php

namespace Database\Seeders;

use App\Models\SupportTicket;
use App\Models\SupportMessage;
use Illuminate\Database\Seeder;

class SupportTicketSeeder extends Seeder
{
    public function run(): void
    {
        $ticket1 = SupportTicket::updateOrCreate(
            ['ticket_code' => 'TCK-1001'],
            [
                'user_name' => 'Tom Phillip',
                'user_email' => 'tom@vyaparadnet.com',
                'subject' => 'Pending Commission Withdrawal',
                'category' => 'Payouts',
                'priority' => 'High',
                'status' => 'Open',
            ]
        );

        SupportMessage::firstOrCreate(
            ['ticket_id' => $ticket1->id, 'sender_name' => 'Tom Phillip'],
            [
                'sender_type' => 'user',
                'message' => 'Hello team, I requested a commission payout of $250 yesterday. When will it reflect in my bank account?',
            ]
        );

        $ticket2 = SupportTicket::updateOrCreate(
            ['ticket_code' => 'TCK-1002'],
            [
                'user_name' => 'Sara Jenkins',
                'user_email' => 'sara@vyaparadnet.com',
                'subject' => 'KYC Verification Status Query',
                'category' => 'KYC & Verification',
                'priority' => 'Medium',
                'status' => 'In Progress',
            ]
        );

        SupportMessage::firstOrCreate(
            ['ticket_id' => $ticket2->id, 'sender_name' => 'Sara Jenkins'],
            [
                'sender_type' => 'user',
                'message' => 'Uploaded my Aadhaar & PAN card documents 2 days ago. Please expedite verification.',
            ]
        );

        SupportMessage::firstOrCreate(
            ['ticket_id' => $ticket2->id, 'sender_name' => 'Rajesh Kumar (Senior Support Admin)'],
            [
                'sender_type' => 'admin',
                'message' => 'Hi Sara, your KYC document review is currently under final compliance verification. It will be marked verified within 1 hour.',
            ]
        );
    }
}
