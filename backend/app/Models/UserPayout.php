<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPayout extends Model
{
    use HasFactory;

    protected $table = 'user_payouts';

    protected $fillable = [
        'payout_code',
        'user_id',
        'user_code',
        'member_name',
        'member_email',
        'member_phone',
        'sponsor',
        'wallet_balance_before',
        'requested_amount',
        'tds_rate',
        'tds_deduction',
        'admin_processing_fee',
        'net_payable_amount',
        'payment_method',
        'bank_name',
        'account_number',
        'ifsc_code',
        'account_holder_name',
        'upi_id',
        'pan_number',
        'kyc_status',
        'status',
        'request_date',
        'processed_date',
        'utr_number',
        'admin_notes',
        'batch_reference',
    ];

    protected $casts = [
        'wallet_balance_before' => 'float',
        'requested_amount' => 'float',
        'tds_rate' => 'float',
        'tds_deduction' => 'float',
        'admin_processing_fee' => 'float',
        'net_payable_amount' => 'float',
        'request_date' => 'datetime',
        'processed_date' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
