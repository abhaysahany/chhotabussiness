<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LevelIncomeAccount extends Model
{
    use HasFactory;

    protected $table = 'level_income_accounts';

    protected $fillable = [
        'user_id',
        'member_id',
        'user_name',
        'level_number',
        'total_amount',
        'paid_amount',
        'balance_amount',
        'dump_amount',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'level_number' => 'integer',
        'total_amount' => 'float',
        'paid_amount' => 'float',
        'balance_amount' => 'float',
        'dump_amount' => 'float',
    ];

    protected $appends = [
        'userId',
        'memberId',
        'userName',
        'levelNumber',
        'totalAmount',
        'paidAmount',
        'balanceAmount',
        'dumpAmount',
    ];

    /**
     * Relationship to recipient User.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Ensure balance is always MAX(total_amount - paid_amount, 0).
     */
    public function getBalanceAmountAttribute($value): float
    {
        $total = (float) ($this->attributes['total_amount'] ?? 0);
        $paid = (float) ($this->attributes['paid_amount'] ?? 0);
        return max(0.0, round($total - $paid, 2));
    }

    // ----------------------------------------------------
    // CamelCase Accessors for Frontend Compatibility
    // ----------------------------------------------------

    public function getUserIdAttribute(): ?int
    {
        return isset($this->attributes['user_id']) ? (int) $this->attributes['user_id'] : null;
    }

    public function getMemberIdAttribute(): ?string
    {
        return $this->attributes['member_id'] ?? null;
    }

    public function getUserNameAttribute(): ?string
    {
        return $this->attributes['user_name'] ?? null;
    }

    public function getLevelNumberAttribute(): int
    {
        return (int) ($this->attributes['level_number'] ?? 0);
    }

    public function getTotalAmountAttribute(): float
    {
        return (float) ($this->attributes['total_amount'] ?? 0);
    }

    public function getPaidAmountAttribute(): float
    {
        return (float) ($this->attributes['paid_amount'] ?? 0);
    }

    public function getDumpAmountAttribute(): float
    {
        return (float) ($this->attributes['dump_amount'] ?? 0);
    }
}
