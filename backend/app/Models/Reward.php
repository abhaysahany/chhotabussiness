<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reward extends Model
{
    use HasFactory;

    protected $table = 'rewards';

    protected $fillable = [
        'title',
        'image',
        'required_bp',
        'category',
        'description',
        'reward_value_inr',
        'status',
    ];

    protected $casts = [
        'required_bp' => 'integer',
        'reward_value_inr' => 'float',
    ];

    public function claims()
    {
        return $this->hasMany(RewardClaim::class, 'reward_id');
    }
}
