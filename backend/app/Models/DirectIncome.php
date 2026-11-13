<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DirectIncome extends Model
{
    use HasFactory;

    protected $table = 'direct_incomes';

    protected $fillable = [
        'order_id',
        'sale_payment_id',
        'source_user_code',
        'percentage',
        'user_code',
        'sponsor_id',
        'total_amount',
        'paid_amount',
        'balance_amount',
        'dump_amount',
    ];

    protected $casts = [
        'order_id' => 'integer',
        'sale_payment_id' => 'integer',
        'percentage' => 'float',
        'total_amount' => 'float',
        'paid_amount' => 'float',
        'balance_amount' => 'float',
        'dump_amount' => 'float',
    ];

    /**
     * Parent Order associated with this direct income distribution.
     */
    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    /**
     * Specific payment receipt associated with this direct income installment.
     */
    public function salePayment()
    {
        return $this->belongsTo(SalePayment::class, 'sale_payment_id');
    }

    /**
     * Alias for salePayment().
     */
    public function payment()
    {
        return $this->salePayment();
    }

    /**
     * Beneficiary member (the sponsor who received the direct income).
     */
    public function beneficiary()
    {
        return $this->belongsTo(User::class, 'user_code', 'user_code');
    }

    /**
     * Purchasing member (downline who placed the order).
     */
    public function sourceUser()
    {
        return $this->belongsTo(User::class, 'source_user_code', 'user_code');
    }
}
