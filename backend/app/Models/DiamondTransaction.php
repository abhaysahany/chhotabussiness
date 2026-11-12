<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiamondTransaction extends Model
{
    use HasFactory;

    protected $table = 'diamond_transactions';

    protected $fillable = [
        'user_id',
        'order_id',
        'sale_payment_id',
        'source_reference',
        'reward_level',
        'source_member_id',
        'source_member_code',
        'allocated_amount',
        'conversion_rate',
        'diamond_quantity',
        'balance_after',
        'transaction_type',
        'description',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'order_id' => 'integer',
        'sale_payment_id' => 'integer',
        'reward_level' => 'integer',
        'source_member_id' => 'integer',
        'allocated_amount' => 'decimal:2',
        'conversion_rate' => 'decimal:2',
        'diamond_quantity' => 'decimal:4',
        'balance_after' => 'decimal:4',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function salePayment()
    {
        return $this->belongsTo(SalePayment::class, 'sale_payment_id');
    }

    public function sourceMember()
    {
        return $this->belongsTo(User::class, 'source_member_id');
    }
}
