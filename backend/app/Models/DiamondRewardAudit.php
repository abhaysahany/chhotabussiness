<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiamondRewardAudit extends Model
{
    use HasFactory;

    protected $table = 'diamond_reward_audits';

    protected $fillable = [
        'order_id',
        'sale_payment_id',
        'reward_level',
        'source_member_id',
        'source_member_code',
        'target_sponsor_code',
        'target_user_id',
        'allocated_amount',
        'conversion_rate',
        'diamond_quantity',
        'status',
        'reason',
    ];

    protected $casts = [
        'order_id' => 'integer',
        'sale_payment_id' => 'integer',
        'reward_level' => 'integer',
        'source_member_id' => 'integer',
        'target_user_id' => 'integer',
        'allocated_amount' => 'decimal:2',
        'conversion_rate' => 'decimal:2',
        'diamond_quantity' => 'decimal:4',
    ];
}
