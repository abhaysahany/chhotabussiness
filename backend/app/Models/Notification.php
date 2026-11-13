<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $table = 'notifications';

    protected $fillable = [
        'title',
        'message',
        'type',
        'target_audience',
        'target_user_id',
        'target_user_code',
        'target_user_name',
        'action_url',
        'recipients_count',
        'created_by',
    ];

    protected $casts = [
        'recipients_count' => 'integer',
    ];

    public function targetUser()
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }

    public function userReads()
    {
        return $this->hasMany(UserNotificationRead::class, 'notification_id');
    }
}
