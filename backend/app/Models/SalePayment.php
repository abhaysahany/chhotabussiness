<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalePayment extends Model
{
    protected $fillable = [
        'sales_record_id',
        'invoice_number',
        'entity_name',
        'customer_name',
        'customer_user_code',
        'sponsor',
        'amount',
        'admin_commission_percent',
        'admin_commission_cut',
        'net_entity_amount',
        'payment_method',
        'reference_no',
        'payment_type',
        'notes',
        'payment_date',
        'direct_income_amount',
        'level_income_amount',
        'reward_income_amount',
        'distributed_admin_cut_amount',
        'income_distribution_status',
        'income_distributed_at',
        'income_distributed_by',
    ];

    protected $casts = [
        'amount' => 'float',
        'admin_commission_percent' => 'float',
        'admin_commission_cut' => 'float',
        'net_entity_amount' => 'float',
        'payment_date' => 'datetime',
        'direct_income_amount' => 'float',
        'level_income_amount' => 'float',
        'reward_income_amount' => 'float',
        'distributed_admin_cut_amount' => 'float',
        'income_distributed_at' => 'datetime',
        'income_distributed_by' => 'integer',
    ];

    protected $appends = [
        'invoiceNumber',
        'entityName',
        'customerName',
        'customerUserCode',
        'adminCommissionPercent',
        'adminCommissionCut',
        'netEntityAmount',
        'paymentMethod',
        'referenceNo',
        'paymentType',
        'paymentDate',
        'directIncomeAmount',
        'levelIncomeAmount',
        'rewardIncomeAmount',
        'distributedAdminCutAmount',
        'incomeDistributionStatus',
        'incomeDistributedAt',
        'incomeDistributedBy',
        'total_project_cost',
        'totalProjectCost',
        'total_admin_amount',
        'totalAdminAmount',
        'remaining_admin_amount',
        'remainingAdminAmount',
    ];

    /**
     * Relationship to parent Order.
     * Links to orders(id) via sales_record_id foreign key.
     */
    public function order()
    {
        return $this->belongsTo(Order::class, 'sales_record_id');
    }

    /**
     * Legacy alias for order().
     */
    public function salesRecord()
    {
        return $this->order();
    }

    /**
     * Relationship to the Direct Income distribution record for this specific payment receipt.
     */
    public function directIncome()
    {
        return $this->hasOne(DirectIncome::class, 'sale_payment_id');
    }

    public function getInvoiceNumberAttribute()
    {
        return $this->attributes['invoice_number'] ?? null;
    }

    public function getEntityNameAttribute()
    {
        return $this->attributes['entity_name'] ?? null;
    }

    public function getCustomerNameAttribute()
    {
        return $this->attributes['customer_name'] ?? null;
    }

    public function getCustomerUserCodeAttribute()
    {
        return $this->attributes['customer_user_code'] ?? null;
    }

    public function getAdminCommissionPercentAttribute()
    {
        return (float) ($this->attributes['admin_commission_percent'] ?? 0);
    }

    public function getAdminCommissionCutAttribute()
    {
        return (float) ($this->attributes['admin_commission_cut'] ?? 0);
    }

    public function getNetEntityAmountAttribute()
    {
        return (float) ($this->attributes['net_entity_amount'] ?? 0);
    }

    public function getPaymentMethodAttribute()
    {
        return $this->attributes['payment_method'] ?? null;
    }

    public function getReferenceNoAttribute()
    {
        return $this->attributes['reference_no'] ?? null;
    }

    public function getPaymentTypeAttribute()
    {
        return $this->attributes['payment_type'] ?? 'advance';
    }

    public function getPaymentDateAttribute()
    {
        $val = $this->attributes['payment_date'] ?? $this->attributes['created_at'] ?? null;
        return $val ? $this->asDateTime($val) : null;
    }

    public function getNetworkDistributionStatusAttribute()
    {
        return $this->attributes['network_distribution_status'] ?? 'pending_admin_distribution';
    }

    public function getDirectCommissionAttribute()
    {
        return (float) ($this->attributes['direct_commission'] ?? 0);
    }

    public function getLevelCommissionsTotalAttribute()
    {
        return (float) ($this->attributes['level_commissions_total'] ?? 0);
    }

    public function getTeamVolumeBvAttribute()
    {
        return (float) ($this->attributes['team_volume_bv'] ?? 0);
    }

    public function getCommissionDistributedAttribute()
    {
        return (bool) ($this->attributes['commission_distributed'] ?? false);
    }

    public function getDistributionDetailsAttribute()
    {
        if (isset($this->attributes['distribution_details'])) {
            return is_string($this->attributes['distribution_details']) 
                ? json_decode($this->attributes['distribution_details'], true) 
                : $this->attributes['distribution_details'];
        }
        return null;
    }

    public function getDirectIncomeAmountAttribute()
    {
        return (float) ($this->attributes['direct_income_amount'] ?? 0);
    }

    public function getLevelIncomeAmountAttribute()
    {
        return (float) ($this->attributes['level_income_amount'] ?? 0);
    }

    public function getRewardIncomeAmountAttribute()
    {
        return (float) ($this->attributes['reward_income_amount'] ?? 0);
    }

    public function getDistributedAdminCutAmountAttribute()
    {
        return (float) ($this->attributes['distributed_admin_cut_amount'] ?? 0);
    }

    public function getIncomeDistributionStatusAttribute()
    {
        return $this->attributes['income_distribution_status'] ?? 'pending';
    }

    public function getIncomeDistributedAtAttribute()
    {
        $val = $this->attributes['income_distributed_at'] ?? null;
        return $val ? $this->asDateTime($val) : null;
    }

    public function getIncomeDistributedByAttribute()
    {
        return $this->attributes['income_distributed_by'] ?? null;
    }

    public function getTotalProjectCostAttribute(): float
    {
        if ($this->relationLoaded('order') && $this->order) {
            return (float) ($this->order->gross_amount ?? 0);
        }
        return (float) ($this->order?->gross_amount ?? 0);
    }

    public function getTotalAdminAmountAttribute(): float
    {
        if ($this->relationLoaded('order') && $this->order) {
            return (float) ($this->order->expected_admin_cut ?? 0);
        }
        return (float) ($this->order?->expected_admin_cut ?? 0);
    }

    public function getRemainingAdminAmountAttribute(): float
    {
        if ($this->relationLoaded('order') && $this->order) {
            return (float) ($this->order->remaining_admin_commission ?? 0);
        }
        return (float) ($this->order?->remaining_admin_commission ?? 0);
    }
}
