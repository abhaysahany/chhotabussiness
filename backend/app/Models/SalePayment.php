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
        'network_distribution_status',
        'direct_commission',
        'level_commissions_total',
        'team_volume_bv',
        'commission_distributed',
        'distribution_details',
    ];

    protected $casts = [
        'amount' => 'float',
        'admin_commission_percent' => 'float',
        'admin_commission_cut' => 'float',
        'net_entity_amount' => 'float',
        'direct_commission' => 'float',
        'level_commissions_total' => 'float',
        'team_volume_bv' => 'float',
        'commission_distributed' => 'boolean',
        'distribution_details' => 'array',
        'payment_date' => 'datetime',
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
        'networkDistributionStatus',
        'directCommission',
        'levelCommissionsTotal',
        'teamVolumeBv',
        'commissionDistributed',
        'distributionDetails',
    ];

    public function salesRecord()
    {
        return $this->belongsTo(SalesRecord::class, 'sales_record_id');
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
        return $this->attributes['payment_date'] ?? $this->attributes['created_at'] ?? null;
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
}
