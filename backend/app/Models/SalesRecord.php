<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesRecord extends Model
{
    protected $fillable = [
        'invoice_number',
        'date',
        'entity_id',
        'entity_name',
        'entity_type',
        'customer_name',
        'customer_email',
        'customer_phone',
        'customer_user_code',
        'customer',
        'sponsor',
        'item',
        'item_type',
        'category',
        'unit_price',
        'quantity',
        'gross_amount',
        'taxable_amount',
        'gst_tax',
        'admin_commission_percent',
        'admin_commission_cut',
        'net_entity_payout',
        'advance_payment',
        'balance_due',
        'payment_method',
        'reference_no',
        'status',
        'network_distribution_status',
        'distribution_details',
        'direct_commission',
        'level_commissions_total',
        'team_volume_bv',
        'commission_distributed',
    ];

    protected $casts = [
        'unit_price' => 'float',
        'quantity' => 'integer',
        'gross_amount' => 'float',
        'taxable_amount' => 'float',
        'gst_tax' => 'float',
        'admin_commission_percent' => 'float',
        'admin_commission_cut' => 'float',
        'net_entity_payout' => 'float',
        'advance_payment' => 'float',
        'balance_due' => 'float',
        'direct_commission' => 'float',
        'level_commissions_total' => 'float',
        'team_volume_bv' => 'float',
        'commission_distributed' => 'boolean',
        'distribution_details' => 'array',
    ];

    protected $appends = [
        'invoiceNumber',
        'customerName',
        'customerEmail',
        'customerPhone',
        'customerUserCode',
        'itemType',
        'entityName',
        'entityType',
        'unitPrice',
        'grossAmount',
        'taxableAmount',
        'gstTax',
        'adminCommissionPercent',
        'adminCommissionCut',
        'netEntityPayout',
        'advancePayment',
        'balanceDue',
        'paymentMethod',
        'referenceNo',
        'networkDistributionStatus',
        'distributionDetails',
        'directCommission',
        'levelCommissionsTotal',
        'teamVolumeBv',
        'commissionDistributed',
    ];

    public function payments()
    {
        return $this->hasMany(SalePayment::class, 'sales_record_id')->orderBy('id', 'desc');
    }

    // Accessors for React camelCase compatibility
    public function getInvoiceNumberAttribute()
    {
        return $this->attributes['invoice_number'] ?? null;
    }

    public function getCustomerNameAttribute()
    {
        return $this->attributes['customer_name'] ?? null;
    }

    public function getCustomerEmailAttribute()
    {
        return $this->attributes['customer_email'] ?? null;
    }

    public function getCustomerPhoneAttribute()
    {
        return $this->attributes['customer_phone'] ?? null;
    }

    public function getCustomerUserCodeAttribute()
    {
        return $this->attributes['customer_user_code'] ?? null;
    }

    public function getItemTypeAttribute()
    {
        return $this->attributes['item_type'] ?? 'service';
    }

    public function getEntityNameAttribute()
    {
        return $this->attributes['entity_name'] ?? null;
    }

    public function getEntityTypeAttribute()
    {
        return $this->attributes['entity_type'] ?? 'business';
    }

    public function getUnitPriceAttribute()
    {
        return (float) ($this->attributes['unit_price'] ?? 0);
    }

    public function getGrossAmountAttribute()
    {
        return (float) ($this->attributes['gross_amount'] ?? 0);
    }

    public function getTaxableAmountAttribute()
    {
        return (float) ($this->attributes['taxable_amount'] ?? 0);
    }

    public function getGstTaxAttribute()
    {
        return (float) ($this->attributes['gst_tax'] ?? 0);
    }

    public function getAdminCommissionPercentAttribute()
    {
        return (float) ($this->attributes['admin_commission_percent'] ?? 0);
    }

    public function getAdminCommissionCutAttribute()
    {
        return (float) ($this->attributes['admin_commission_cut'] ?? 0);
    }

    public function getNetEntityPayoutAttribute()
    {
        return (float) ($this->attributes['net_entity_payout'] ?? 0);
    }

    public function getAdvancePaymentAttribute()
    {
        return (float) ($this->attributes['advance_payment'] ?? 0);
    }

    public function getBalanceDueAttribute()
    {
        return (float) ($this->attributes['balance_due'] ?? 0);
    }

    public function getPaymentMethodAttribute()
    {
        return $this->attributes['payment_method'] ?? null;
    }

    public function getReferenceNoAttribute()
    {
        return $this->attributes['reference_no'] ?? null;
    }

    public function getNetworkDistributionStatusAttribute()
    {
        return $this->attributes['network_distribution_status'] ?? 'pending_admin_distribution';
    }

    public function getDistributionDetailsAttribute()
    {
        $val = $this->attributes['distribution_details'] ?? null;
        if (is_string($val)) {
            return json_decode($val, true);
        }
        return $val;
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
}
