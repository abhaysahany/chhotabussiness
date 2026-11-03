<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LevelIncome extends Model
{
    use HasFactory;

    protected $table = 'level_incomes';

    protected $fillable = [
        'user_code',
        'level_id',
        'level',
        'total_amount',
        'paid_amount',
        'balance_amount',
        'dump_amount',
    ];

    protected $casts = [
        'level' => 'integer',
        'total_amount' => 'float',
        'paid_amount' => 'float',
        'balance_amount' => 'float',
        'dump_amount' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_code', 'user_code');
    }
}
