<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LevelIncome extends Model
{
    use HasFactory;

    protected $table = 'level_incomes';

    protected $fillable = [
        'order_id',
        'invoice_number',
        'payment_id',
        'payment_type',
        'user_code',
        'level_id',
        'level',
        'amount',
    ];

    protected $casts = [
        'level' => 'integer',
        'amount' => 'float',
    ];

    /**
     * Backward-compatible total_amount accessor
     */
    public function getTotalAmountAttribute()
    {
        return (float) ($this->attributes['amount'] ?? 0);
    }

    /**
     * Backward-compatible paid_amount accessor
     */
    public function getPaidAmountAttribute()
    {
        return (float) ($this->attributes['amount'] ?? 0);
    }

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
