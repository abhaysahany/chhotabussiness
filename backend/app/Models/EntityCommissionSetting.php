<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class EntityCommissionSetting extends Model
{
    use HasFactory;

    protected $table = 'commission_settings';

    protected $fillable = [
        'setting_key',
        'entity_type',
        'entity_id',
        'direct_percent',
        'level_1_percent',
        'level_2_percent',
        'level_3_percent',
        'level_4_percent',
        'level_5_percent',
        'reward_percent',
        'reward_level_1_percent',
        'reward_level_2_percent',
        'is_custom',
        'updated_by_admin_id',
    ];

    protected $casts = [
        'entity_id' => 'integer',
        'direct_percent' => 'float',
        'level_1_percent' => 'float',
        'level_2_percent' => 'float',
        'level_3_percent' => 'float',
        'level_4_percent' => 'float',
        'level_5_percent' => 'float',
        'reward_percent' => 'float',
        'reward_level_1_percent' => 'float',
        'reward_level_2_percent' => 'float',
        'is_custom' => 'boolean',
    ];

    /**
     * Auto generate unique setting_key on creation if not provided
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->setting_key)) {
                if ($model->entity_type && $model->entity_id) {
                    $model->setting_key = 'entity_' . $model->entity_type . '_' . $model->entity_id;
                } else {
                    $model->setting_key = 'custom_' . uniqid();
                }
            }
        });
    }

    /**
     * Default percentages structure for unconfigured business entities
     */
    public static function defaultBusinessSettings(): array
    {
        return [
            'direct_percent' => 10.0,
            'level_2_percent' => 4.0,
            'level_3_percent' => 3.0,
            'level_4_percent' => 2.0,
            'level_5_percent' => 1.0,
            'reward_percent' => 5.0,
        ];
    }

    /**
     * Default percentages structure for unconfigured entities
     */
    public static function defaultSettings(string $entityType = 'business'): array
    {
        return self::defaultBusinessSettings();
    }

    /**
     * Resolve effective commission settings for an entity, product, or service.
     */
    public static function resolveForEntity(?string $entityType, ?string $entityName = null, ?int $entityId = null): array
    {
        $setting = null;
        $type = ($entityType === 'freelance' || $entityType === 'freelancer') ? 'freelancer' : 'business';

        if ($entityId) {
            $setting = self::where(function ($q) use ($type, $entityId) {
                $q->where('entity_type', $type)->where('entity_id', $entityId);
            })->orWhere('setting_key', "entity_{$type}_{$entityId}")->first();
        }

        if (!$setting && !empty($entityName)) {
            if ($type === 'business') {
                $entity = BusinessEntity::where('name', $entityName)
                    ->orWhere('owner_name', $entityName)
                    ->orWhere('name', 'like', '%' . $entityName . '%')
                    ->first();
            } else {
                $entity = FreelancerEntity::where('name', $entityName)
                    ->orWhere('name', 'like', '%' . $entityName . '%')
                    ->first();
            }
            if ($entity) {
                $setting = self::where(function ($q) use ($type, $entity) {
                    $q->where('entity_type', $type)->where('entity_id', $entity->id);
                })->orWhere('setting_key', "entity_{$type}_{$entity->id}")->first();
            }
        }

        if ($setting) {
            $direct = (float) $setting->direct_percent;
            $l2 = (float) $setting->level_2_percent;
            $l3 = (float) $setting->level_3_percent;
            $l4 = (float) $setting->level_4_percent;
            $l5 = (float) $setting->level_5_percent;
            $reward = (float) $setting->reward_percent;
            $networkLevelsTotal = round($l2 + $l3 + $l4 + $l5, 2);
            $totalCommission = round($direct + $networkLevelsTotal, 2);

            return [
                'direct_percent' => $direct,
                'level_1_percent' => (float) ($setting->level_1_percent ?? 0.0),
                'level_2_percent' => $l2,
                'level_3_percent' => $l3,
                'level_4_percent' => $l4,
                'level_5_percent' => $l5,
                'reward_percent' => $reward,
                'network_levels_total' => $networkLevelsTotal,
                'total_commission_percent' => $totalCommission,
                'is_custom' => (bool) $setting->is_custom,
                'source' => 'entity_configured',
                'setting_id' => $setting->id,
            ];
        }

        // Fallback to global setting in commission_settings table
        $global = self::where('setting_key', 'global')->first() ?? self::first();
        if ($global) {
            $direct = (float) $global->direct_percent;
            $l2 = (float) $global->level_2_percent;
            $l3 = (float) $global->level_3_percent;
            $l4 = (float) $global->level_4_percent;
            $l5 = (float) $global->level_5_percent;
            $reward = (float) $global->reward_percent;
            $networkLevelsTotal = round($l2 + $l3 + $l4 + $l5, 2);
            $totalCommission = round($direct + $networkLevelsTotal, 2);

            return [
                'direct_percent' => $direct,
                'level_1_percent' => (float) ($global->level_1_percent ?? 0.0),
                'level_2_percent' => $l2,
                'level_3_percent' => $l3,
                'level_4_percent' => $l4,
                'level_5_percent' => $l5,
                'reward_percent' => $reward,
                'network_levels_total' => $networkLevelsTotal,
                'total_commission_percent' => $totalCommission,
                'is_custom' => false,
                'source' => 'commission_settings_global',
                'setting_id' => $global->id,
            ];
        }

        $defaults = self::defaultBusinessSettings();
        $networkLevelsTotal = round($defaults['level_2_percent'] + $defaults['level_3_percent'] + $defaults['level_4_percent'] + $defaults['level_5_percent'], 2);
        $totalCommission = round($defaults['direct_percent'] + $networkLevelsTotal, 2);

        return [
            'direct_percent' => (float) $defaults['direct_percent'],
            'level_1_percent' => 0.0,
            'level_2_percent' => (float) $defaults['level_2_percent'],
            'level_3_percent' => (float) $defaults['level_3_percent'],
            'level_4_percent' => (float) $defaults['level_4_percent'],
            'level_5_percent' => (float) $defaults['level_5_percent'],
            'reward_percent' => (float) $defaults['reward_percent'],
            'network_levels_total' => $networkLevelsTotal,
            'total_commission_percent' => $totalCommission,
            'is_custom' => false,
            'source' => 'system_default',
            'setting_id' => null,
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
