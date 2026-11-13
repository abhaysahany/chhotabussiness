<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    use HasFactory;

    protected $table = 'support_tickets';

    protected $fillable = [
        'ticket_code',
        'user_id',
        'user_name',
        'user_email',
        'subject',
        'category',
        'priority',
        'status',
    ];

    public function messages()
    {
        return $this->hasMany(SupportMessage::class, 'ticket_id');
    }
}
