<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    /**
     * Canonical database table for orders.
     */
    protected $table = 'orders';

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
        'dump_amount',
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
        'approval_status',
        'admin_confirmed_by',
        'admin_confirmed_at',
        'admin_cancelled_by',
        'admin_cancelled_at',
        'cancellation_reason',
        'network_distribution_status',
        'distribution_details',
        'direct_commission',
        'level_commissions_total',
        'team_volume_bv',
        'commission_distributed',
        'direct_income_amount',
        'level_income_amount',
        'reward_income_amount',
        'distributed_admin_cut_amount',
        'income_distribution_status',
        'income_distributed_at',
    ];

    protected $casts = [
        'unit_price' => 'float',
        'quantity' => 'integer',
        'gross_amount' => 'float',
        'dump_amount' => 'float',
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
        'direct_income_amount' => 'float',
        'level_income_amount' => 'float',
        'reward_income_amount' => 'float',
        'distributed_admin_cut_amount' => 'float',
        'income_distributed_at' => 'datetime',
        'admin_confirmed_by' => 'integer',
        'admin_confirmed_at' => 'datetime',
        'admin_cancelled_by' => 'integer',
        'admin_cancelled_at' => 'datetime',
    ];

    protected $appends = [
        'invoiceNumber',
        'customerName',
        'customerEmail',
        'customerPhone',
        'customerUserCode',
        'itemType',
        'entityId',
        'entityName',
        'entityType',
        'unitPrice',
        'grossAmount',
        'dumpAmount',
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
        'directIncomeAmount',
        'levelIncomeAmount',
        'rewardIncomeAmount',
        'distributedAdminCutAmount',
        'incomeDistributionStatus',
        'incomeDistributedAt',
        'expectedAdminCut',
        'expected_admin_cut',
        'adminCommissionCollected',
        'admin_commission_collected',
        'remainingAdminCommission',
        'remaining_admin_commission',
        'totalPaymentReceived',
        'total_payment_received',
        'remainingProjectBalance',
        'remaining_project_balance',
        'approval_status',
        'approvalStatus',
        'admin_confirmed_by',
        'adminConfirmedBy',
        'admin_confirmed_at',
        'adminConfirmedAt',
        'admin_cancelled_by',
        'adminCancelledBy',
        'admin_cancelled_at',
        'adminCancelledAt',
        'cancellation_reason',
        'cancellationReason',
        'approved_dump_amount',
        'approvedDumpAmount',
        'approved_dump_admin_cut',
        'approvedDumpAdminCut',
        'payment_settlement_status',
        'paymentSettlementStatus',
        'dump_requests',
        'dumpRequests',
    ];

    /**
     * Relationship to payment installments/receipts.
     * Foreign key retained as sales_record_id for zero-risk data preservation.
     */
    public function payments()
    {
        return $this->hasMany(SalePayment::class, 'sales_record_id')->orderBy('id', 'desc');
    }

    /**
     * Alias for payments() matching salePayments terminology.
     */
    public function salePayments()
    {
        return $this->payments();
    }

    /**
     * Relationship to Dump Payment requests.
     */
    public function dumpRequests()
    {
        return $this->hasMany(OrderPaymentDump::class, 'order_id')->orderBy('id', 'desc');
    }

    /**
     * Relationship to approved Dump Payments.
     */
    public function approvedDumps()
    {
        return $this->hasMany(OrderPaymentDump::class, 'order_id')->where('status', 'approved')->orderBy('id', 'desc');
    }

    // Accessors for React camelCase compatibility
    public function getEntityIdAttribute()
    {
        return $this->attributes['entity_id'] ?? null;
    }

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
        return $this->attributes['income_distributed_at'] ?? null;
    }

    public function getDumpAmountAttribute()
    {
        return (float) ($this->attributes['dump_amount'] ?? 0);
    }

    public function getApprovedDumpAmountAttribute(): float
    {
        if ($this->relationLoaded('approvedDumps')) {
            return (float) round($this->approvedDumps->sum('dump_amount'), 2);
        }
        if ($this->relationLoaded('dumpRequests')) {
            return (float) round($this->dumpRequests->where('status', 'approved')->sum('dump_amount'), 2);
        }
        if ($this->exists) {
            $sum = (float) $this->approvedDumps()->sum('dump_amount');
            if ($sum > 0 || $this->dumpRequests()->exists()) {
                return round($sum, 2);
            }
        }
        return (float) ($this->attributes['dump_amount'] ?? 0);
    }

    public function getApprovedDumpAdminCutAttribute(): float
    {
        if ($this->relationLoaded('approvedDumps')) {
            return (float) round($this->approvedDumps->sum('admin_commission_cut'), 2);
        }
        if ($this->relationLoaded('dumpRequests')) {
            return (float) round($this->dumpRequests->where('status', 'approved')->sum('admin_commission_cut'), 2);
        }
        if ($this->exists) {
            $sum = (float) $this->approvedDumps()->sum('admin_commission_cut');
            if ($sum > 0 || $this->dumpRequests()->exists()) {
                return round($sum, 2);
            }
        }
        $dumpAmount = (float) ($this->attributes['dump_amount'] ?? 0);
        if ($dumpAmount > 0) {
            $rate = (float) ($this->attributes['admin_commission_percent'] ?? 15);
            return round(($dumpAmount * $rate) / 100, 2);
        }
        return 0.0;
    }

    public function getExpectedAdminCutAttribute(): float
    {
        $rate = (float) ($this->attributes['admin_commission_percent'] ?? 15);
        $gross = (float) ($this->attributes['gross_amount'] ?? 0);
        return (float) ($this->attributes['admin_commission_cut'] ?? round(($gross * $rate) / 100, 2));
    }

    public function getTotalPaymentReceivedAttribute(): float
    {
        if ($this->relationLoaded('payments')) {
            $sum = (float) $this->payments->sum('amount');
            return $sum > 0 ? $sum : (float) ($this->attributes['advance_payment'] ?? 0);
        }
        return (float) ($this->attributes['advance_payment'] ?? 0);
    }

    public function getRemainingProjectBalanceAttribute(): float
    {
        $received = $this->total_payment_received;
        $gross = (float) ($this->attributes['gross_amount'] ?? 0);
        $approvedDump = $this->approved_dump_amount;
        return max(0.0, round($gross - $received - $approvedDump, 2));
    }

    public function getAdminCommissionCollectedAttribute(): float
    {
        if ($this->relationLoaded('payments')) {
            return (float) round($this->payments->sum('admin_commission_cut'), 2);
        }
        return (float) round($this->payments()->sum('admin_commission_cut'), 2);
    }

    public function getRemainingAdminCommissionAttribute(): float
    {
        $expected = $this->expected_admin_cut;
        $collected = $this->admin_commission_collected;
        $dumpCut = $this->approved_dump_admin_cut;
        return max(0.0, round($expected - $collected - $dumpCut, 2));
    }

    public function getPaymentSettlementStatusAttribute(): string
    {
        $gross = (float) ($this->attributes['gross_amount'] ?? 0);
        $received = $this->total_payment_received;
        $balance = $this->remaining_project_balance;
        $approvedDump = $this->approved_dump_amount;

        if ($received >= $gross && $gross > 0) {
            return 'Fully Paid (Cash)';
        }

        if ($balance <= 0 && $approvedDump > 0) {
            return 'Closed via Dump';
        }

        if ($approvedDump > 0 && $balance > 0) {
            return 'Partial Dump Write-Off';
        }

        if ($received > 0 && $balance > 0) {
            return 'Partially Paid';
        }

        return 'Unpaid';
    }

    public function getDumpRequestsAttribute()
    {
        if ($this->relationLoaded('dumpRequests')) {
            return $this->getRelation('dumpRequests');
        }
        if ($this->exists) {
            return $this->dumpRequests()->get();
        }
        return collect();
    }

    public function getApprovalStatusAttribute()
    {
        return $this->attributes['approval_status'] ?? 'confirmed';
    }

    public function getAdminConfirmedByAttribute()
    {
        return $this->attributes['admin_confirmed_by'] ?? null;
    }

    public function getAdminConfirmedAtAttribute()
    {
        return $this->attributes['admin_confirmed_at'] ?? null;
    }

    public function getAdminCancelledByAttribute()
    {
        return $this->attributes['admin_cancelled_by'] ?? null;
    }

    public function getAdminCancelledAtAttribute()
    {
        return $this->attributes['admin_cancelled_at'] ?? null;
    }

    public function getCancellationReasonAttribute()
    {
        return $this->attributes['cancellation_reason'] ?? null;
    }
}
