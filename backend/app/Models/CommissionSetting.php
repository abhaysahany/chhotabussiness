<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class CommissionSetting extends Model
{
    use HasFactory;

    public const GLOBAL_SETTING_KEY = 'global';

    protected $table = 'commission_settings';

    protected $guarded = ['id'];

    /**
     * Dynamically discover all level_N_percent columns from the database schema,
     * sorted numerically by level number.
     *
     * @return array<int, array{level: int, key: string, label: string}>
     */
    public static function getLevelColumns(): array
    {
        $instance = new static();
        $columns = Schema::connection($instance->getConnectionName())->getColumnListing($instance->getTable());

        $levels = [];
        foreach ($columns as $column) {
            if (preg_match('/^level_(\d+)_percent$/', $column, $matches)) {
                $levelNum = (int) $matches[1];
                $levels[] = [
                    'level' => $levelNum,
                    'key' => $column,
                    'label' => "Level {$levelNum}",
                ];
            }
        }

        usort($levels, fn ($a, $b) => $a['level'] <=> $b['level']);

        return $levels;
    }

    /**
     * Dynamically include percentage casts for all discovered level columns.
     */
    public function getCasts(): array
    {
        $casts = array_merge(parent::getCasts(), [
            'direct_percent' => 'float',
            'reward_percent' => 'float',
            'reward_level_1_percent' => 'float',
            'reward_level_2_percent' => 'float',
            'updated_by_admin_id' => 'integer',
        ]);

        foreach (self::getLevelColumns() as $levelCol) {
            $casts[$levelCol['key']] = 'float';
        }

        return $casts;
    }

    /**
     * Administrator who last updated this global configuration.
     */
    public function updatedByAdmin()
    {
        return $this->belongsTo(Admin::class, 'updated_by_admin_id');
    }

    /**
     * Retrieve the single global CommissionSetting row.
     */
    public static function getGlobalRecord(bool $lockForUpdate = false): ?self
    {
        $query = self::with('updatedByAdmin')->where('setting_key', self::GLOBAL_SETTING_KEY);

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        return $query->first();
    }

    /**
     * Convert a CommissionSetting model into a normalized array payload.
     */
    public function toNormalizedArray(?array $levelColumns = null): array
    {
        $levelColumns = $levelColumns ?? self::getLevelColumns();
        $directPercent = round((float) $this->direct_percent, 2);
        $rewardL1Percent = round((float) ($this->reward_level_1_percent ?? 0.0), 2);
        $rewardL2Percent = round((float) ($this->reward_level_2_percent ?? 0.0), 2);
        $rewardTotalPercent = round(($rewardL1Percent + $rewardL2Percent), 2);

        $levels = [];
        $levelMap = [];
        $levelBasisPoints = 0;

        $payload = [
            'id' => $this->id,
            'setting_key' => $this->setting_key,
            'direct_percent' => $directPercent,
        ];

        foreach ($levelColumns as $col) {
            $key = $col['key'];
            $lvlNum = $col['level'];
            $pct = round((float) ($this->{$key} ?? 0.0), 2);
            $payload[$key] = $pct;
            $levelMap[$lvlNum] = $pct;
            $levelBasisPoints += (int) round($pct * 100);
            $levels[] = [
                'level' => $lvlNum,
                'key' => $key,
                'label' => $col['label'],
                'percent' => $pct,
            ];
        }

        $levelTotalPercent = round($levelBasisPoints / 100, 2);
        $rewardBasisPoints = (int) round($rewardL1Percent * 100) + (int) round($rewardL2Percent * 100);
        $totalBasisPoints = (int) round($directPercent * 100) + $levelBasisPoints + $rewardBasisPoints;
        $totalPercent = round($totalBasisPoints / 100, 2);

        $payload['levels'] = $levels;
        $payload['level_percents_map'] = $levelMap;
        $payload['level_total_percent'] = $levelTotalPercent;
        $payload['reward_level_1_percent'] = $rewardL1Percent;
        $payload['reward_level_2_percent'] = $rewardL2Percent;
        $payload['reward_total_percent'] = $rewardTotalPercent;
        $payload['reward_percent'] = $rewardTotalPercent;
        $payload['diamond_conversion_rate'] = (float) config('mlm.diamond_conversion_rate', 100.00);
        $payload['total_percent'] = $totalPercent;
        $payload['updated_by_admin_id'] = $this->updated_by_admin_id;
        $payload['updated_by_admin_name'] = $this->updatedByAdmin?->name;
        $payload['updated_by_admin_email'] = $this->updatedByAdmin?->email;
        $payload['updated_at'] = $this->updated_at?->toIso8601String();
        $payload['created_at'] = $this->created_at?->toIso8601String();

        return $payload;
    }

    /**
     * Load and strictly validate the active global Commission Settings snapshot.
     * Fails loudly if the configuration is missing or does not total 100%.
     * Never returns fabricated hardcoded fallback percentages.
     *
     * @throws InvalidArgumentException
     */
    public static function getValidatedGlobalSnapshot(bool $lockForUpdate = false): array
    {
        $setting = self::getGlobalRecord($lockForUpdate);

        if (!$setting) {
            throw new InvalidArgumentException(
                'Global Commission Settings configuration is missing. Please configure Commission Settings in the Admin Panel before distributing income.'
            );
        }

        $levelColumns = self::getLevelColumns();
        if (empty($levelColumns)) {
            throw new InvalidArgumentException(
                'Global Commission Settings schema has no Level Income percentage columns configured.'
            );
        }

        $normalized = $setting->toNormalizedArray($levelColumns);

        $fieldsToCheck = ['Direct Income' => $normalized['direct_percent']];
        foreach ($normalized['levels'] as $lvl) {
            $fieldsToCheck[$lvl['label']] = $lvl['percent'];
        }
        $fieldsToCheck['Reward Level 1 – Direct Sponsor'] = $normalized['reward_level_1_percent'];
        $fieldsToCheck['Reward Level 2 – Sponsor\'s Sponsor'] = $normalized['reward_level_2_percent'];

        $totalBasisPoints = 0;
        foreach ($fieldsToCheck as $label => $pct) {
            if (!is_numeric($pct) || $pct < 0 || $pct > 100) {
                throw new InvalidArgumentException(
                    "Invalid Global Commission Settings percentage for {$label}: {$pct}%. Each percentage must be between 0% and 100%."
                );
            }
            $totalBasisPoints += (int) round(((float) $pct) * 100);
        }

        if ($totalBasisPoints !== 10000) {
            $actualTotal = round($totalBasisPoints / 100, 2);
            throw new InvalidArgumentException(
                "Invalid Global Commission Settings configuration: total allocation is {$actualTotal}%, must equal exactly 100%."
            );
        }

        return $normalized;
    }
}
