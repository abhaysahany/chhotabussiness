<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserNotificationRead extends Model
{
    use HasFactory;

    protected $table = 'user_notification_reads';

    protected $fillable = [
        'user_id',
        'user_code',
        'notification_id',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function notification()
    {
        return $this->belongsTo(Notification::class, 'notification_id');
    }
}
