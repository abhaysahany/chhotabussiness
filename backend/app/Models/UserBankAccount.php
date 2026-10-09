<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserBankAccount extends Model
{
    use HasFactory;

    protected $table = 'user_bank_accounts';

    protected $fillable = [
        'user_id',
        'user_code',
        'bank_name',
        'account_number',
        'ifsc_code',
        'account_holder_name',
        'branch',
        'is_primary',
        'is_verified',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_verified' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
