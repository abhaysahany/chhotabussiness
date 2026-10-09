<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RewardClaim extends Model
{
    use HasFactory;

    protected $table = 'reward_claims';

    protected $fillable = [
        'claim_code',
        'user_id',
        'user_code',
        'member_name',
        'member_email',
        'member_phone',
        'reward_id',
        'reward_title',
        'reward_image',
        'points_deducted',
        'bp_balance_before',
        'bp_balance_after',
        'shipping_address',
        'shipping_city',
        'shipping_state',
        'shipping_pincode',
        'status',
        'courier_partner',
        'tracking_number',
        'admin_notes',
        'claim_date',
        'processed_date',
    ];

    protected $casts = [
        'points_deducted' => 'integer',
        'bp_balance_before' => 'float',
        'bp_balance_after' => 'float',
        'claim_date' => 'datetime',
        'processed_date' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function reward()
    {
        return $this->belongsTo(Reward::class, 'reward_id');
    }
}
