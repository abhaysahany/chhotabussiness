<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WalletTransfer extends Model
{
    use HasFactory;

    protected $table = 'wallet_transfers';

    protected $fillable = [
        'memberid',
        'walletType',
        'credit',
        'debit',
        'balance',
        'particular',
    ];

    protected $casts = [
        'credit' => 'float',
        'debit' => 'float',
        'balance' => 'float',
    ];
}
