<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EntityCommissionSetting extends Model
{
    use HasFactory;

    protected $table = 'entity_commission_settings';

    protected $fillable = [
        'entity_type',
        'entity_id',
        'direct_percent',
        'level_1_percent',
        'level_2_percent',
        'level_3_percent',
        'level_4_percent',
        'reward_percent',
    ];

    protected $casts = [
        'entity_id' => 'integer',
        'direct_percent' => 'float',
        'level_1_percent' => 'float',
        'level_2_percent' => 'float',
        'level_3_percent' => 'float',
        'level_4_percent' => 'float',
        'reward_percent' => 'float',
    ];

    /**
     * Default percentages structure for unconfigured entities
     */
    public static function defaultSettings(): array
    {
        return [
            'direct_percent' => 0.0,
            'level_1_percent' => 0.0,
            'level_2_percent' => 0.0,
            'level_3_percent' => 0.0,
            'level_4_percent' => 0.0,
            'reward_percent' => 0.0,
        ];
    }

    /**
     * Get parent entity instance
     */
    public function getEntityAttribute()
    {
        if ($this->entity_type === 'business') {
            return BusinessEntity::find($this->entity_id);
        }
        if ($this->entity_type === 'freelancer') {
            return FreelancerEntity::find($this->entity_id);
        }
        return null;
    }
}
