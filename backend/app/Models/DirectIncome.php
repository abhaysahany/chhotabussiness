<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DirectIncome extends Model
{
    use HasFactory;

    protected $table = 'direct_incomes';

    protected $fillable = [
        'user_code',
        'sponsor_id',
        'total_amount',
        'paid_amount',
        'balance_amount',
        'dump_amount',
    ];

    protected $casts = [
        'total_amount' => 'float',
        'paid_amount' => 'float',
        'balance_amount' => 'float',
        'dump_amount' => 'float',
    ];
}
