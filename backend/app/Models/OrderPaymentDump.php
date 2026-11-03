<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderPaymentDump extends Model
{
    protected $table = 'order_payment_dumps';

    protected $fillable = [
        'order_id',
        'invoice_number',
        'entity_id',
        'entity_name',
        'customer_name',
        'customer_user_code',
        'dump_amount',
        'admin_commission_percent',
        'admin_commission_cut',
        'direct_income_amount',
        'level_income_amount',
        'reward_income_amount',
        'dump_reason',
        'admin_rejection_reason',
        'notes',
        'status',
        'requested_at',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
    ];

    protected $casts = [
        'dump_amount' => 'float',
        'admin_commission_percent' => 'float',
        'admin_commission_cut' => 'float',
        'direct_income_amount' => 'float',
        'level_income_amount' => 'float',
        'reward_income_amount' => 'float',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'approved_by' => 'integer',
        'rejected_by' => 'integer',
    ];

    /**
     * Parent Order relationship.
     */
    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    /**
     * Admin who approved the dump request.
     */
    public function adminApprover()
    {
        return $this->belongsTo(Admin::class, 'approved_by');
    }

    /**
     * Admin who rejected the dump request.
     */
    public function adminRejecter()
    {
        return $this->belongsTo(Admin::class, 'rejected_by');
    }
}
