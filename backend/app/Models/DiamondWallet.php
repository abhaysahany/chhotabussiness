<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiamondWallet extends Model
{
    use HasFactory;

    protected $table = 'diamond_wallets';

    protected $fillable = [
        'user_id',
        'diamond_balance',
        'level_1_diamonds',
        'level_2_diamonds',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'diamond_balance' => 'decimal:4',
        'level_1_diamonds' => 'decimal:4',
        'level_2_diamonds' => 'decimal:4',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function transactions()
    {
        return $this->hasMany(DiamondTransaction::class, 'user_id', 'user_id');
    }
}
