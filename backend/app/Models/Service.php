<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $table = 'services';

    protected $fillable = [
        'name',
        'category',
        'owner_type',
        'owner_name',
        'price',
        'admin_commission_percent',
        'duration',
        'status',
        'image',
        'description',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'admin_commission_percent' => 'decimal:2',
    ];

    protected $appends = [
        'commission_settings',
    ];

    /**
     * Resolve authoritative commission settings associated with the service's owner entity.
     */
    public function getCommissionSettingsAttribute(): array
    {
        return EntityCommissionSetting::resolveForEntity($this->owner_type, $this->owner_name);
    }
}
