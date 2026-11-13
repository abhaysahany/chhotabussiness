<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DirectIncomeOrderSummary extends Model
{
    use HasFactory;

    protected $table = 'direct_income_order_summaries';

    protected $fillable = [
        'user_id',
        'user_code',
        'order_id',
        'invoice_number',
        'source_user_code',
        'source_user_name',
        'item_name',
        'order_gross_amount',
        'total_expected_amount',
        'total_distributed_amount',
        'total_pending_amount',
        'total_dump_amount',
        'distribution_count',
        'distribution_status',
        'last_distribution_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'order_id' => 'integer',
        'order_gross_amount' => 'float',
        'total_expected_amount' => 'float',
        'total_distributed_amount' => 'float',
        'total_pending_amount' => 'float',
        'total_dump_amount' => 'float',
        'distribution_count' => 'integer',
        'last_distribution_at' => 'datetime',
    ];

    /**
     * Beneficiary user (the Sponsor who earns the Direct Income).
     */
    public function beneficiary()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Alias for beneficiary().
     */
    public function user()
    {
        return $this->beneficiary();
    }

    /**
     * Parent Order.
     */
    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    /**
     * Source member who purchased the order (downline customer).
     */
    public function sourceUser()
    {
        return $this->belongsTo(User::class, 'source_user_code', 'user_code');
    }

    /**
     * Traceable Direct Income ledger entries for this order and beneficiary.
     */
    public function directIncomes()
    {
        return $this->hasMany(DirectIncome::class, 'order_id', 'order_id')
            ->where('user_code', $this->user_code);
    }

    /**
     * Payment installments associated with the parent order.
     */
    public function payments()
    {
        return $this->hasMany(SalePayment::class, 'sales_record_id', 'order_id');
    }
}
