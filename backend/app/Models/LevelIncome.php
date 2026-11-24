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
        'total_amount',
        'paid_amount',
        'balance_amount',
        'dump_amount',
    ];

    public ?float $total_amount_input = null;
    public ?float $paid_amount_input = null;
    public ?float $balance_amount_input = null;
    public ?float $dump_amount_input = null;

    protected static function booted()
    {
        static::created(function ($model) {
            if (!empty($model->user_code)) {
                $query = TotalLevelIncome::where('user_code', $model->user_code)
                    ->where('level', (string) $model->level);

                if (!empty($model->order_id)) {
                    $query->where('order_id', $model->order_id);
                }

                $exists = $query->exists();

                if (!$exists) {
                    $tot = $model->total_amount_input ?? (float) ($model->amount ?? 0);
                    $pd = $model->paid_amount_input ?? (float) ($model->amount ?? 0);
                    $dmp = $model->dump_amount_input ?? 0.00;
                    $bal = $model->balance_amount_input ?? max(0.0, round($tot - $pd - $dmp, 2));

                    TotalLevelIncome::create([
                        'order_id' => $model->order_id,
                        'invoice_number' => $model->invoice_number,
                        'user_code' => $model->user_code,
                        'level_id' => $model->level_id,
                        'level' => (string) $model->level,
                        'payment_type' => $model->payment_type ?? 'advance',
                        'total_amount' => $tot,
                        'paid_amount' => $pd,
                        'balance_amount' => $bal,
                        'dump_amount' => $dmp,
                    ]);
                }
            }
        });
    }

    protected $casts = [
        'level' => 'integer',
        'amount' => 'float',
    ];

    /**
     * Backward-compatible total_amount accessor
     */
    public function getTotalAmountAttribute()
    {
        return $this->total_amount_input !== null
            ? (float) $this->total_amount_input
            : (float) ($this->attributes['amount'] ?? 0);
    }

    /**
     * Backward-compatible total_amount mutator
     */
    public function setTotalAmountAttribute($value)
    {
        $this->total_amount_input = (float) $value;
        $this->attributes['amount'] = (float) $value;
    }

    /**
     * Backward-compatible paid_amount accessor
     */
    public function getPaidAmountAttribute()
    {
        return $this->paid_amount_input !== null
            ? (float) $this->paid_amount_input
            : (float) ($this->attributes['amount'] ?? 0);
    }

    /**
     * Backward-compatible paid_amount mutator
     */
    public function setPaidAmountAttribute($value)
    {
        $this->paid_amount_input = (float) $value;
        if (!isset($this->attributes['amount']) || $this->attributes['amount'] === null) {
            $this->attributes['amount'] = (float) $value;
        }
    }

    /**
     * Backward-compatible dump_amount accessor
     */
    public function getDumpAmountAttribute()
    {
        return $this->dump_amount_input !== null
            ? (float) $this->dump_amount_input
            : 0.0;
    }

    /**
     * Backward-compatible dump_amount mutator
     */
    public function setDumpAmountAttribute($value)
    {
        $this->dump_amount_input = (float) $value;
    }

    /**
     * Backward-compatible balance_amount accessor
     */
    public function getBalanceAmountAttribute()
    {
        return $this->balance_amount_input !== null
            ? (float) $this->balance_amount_input
            : max(0.0, round($this->total_amount - $this->paid_amount - $this->dump_amount, 2));
    }

    /**
     * Backward-compatible balance_amount mutator
     */
    public function setBalanceAmountAttribute($value)
    {
        $this->balance_amount_input = (float) $value;
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
