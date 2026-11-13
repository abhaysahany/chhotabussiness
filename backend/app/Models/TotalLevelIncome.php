<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TotalLevelIncome extends Model
{
    use HasFactory;

    protected $table = 'total_level_incomes';

    protected $fillable = [
        'order_id',
        'invoice_number',
        'user_code',
        'level_id',
        'level',
        'payment_type',
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

    /**
     * Backward-compatible label accessor
     */
    public function getLabelAttribute()
    {
        return $this->attributes['level'] ?? null;
    }

    /**
     * Backward-compatible label mutator
     */
    public function setLabelAttribute($value)
    {
        $this->attributes['level'] = $value;
    }

    /**
     * Backward-compatible from_user_code accessor
     */
    public function getFromUserCodeAttribute()
    {
        return $this->attributes['level_id'] ?? null;
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_code', 'user_code');
    }
}
