<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $table = 'products';

    protected $fillable = [
        'name',
        'category',
        'owner_type',
        'owner_name',
        'price',
        'admin_commission_percent',
        'stock',
        'sku',
        'status',
        'image',
        'description',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'admin_commission_percent' => 'decimal:2',
        'stock' => 'integer',
    ];

    protected $appends = [
        'commission_settings',
    ];

    /**
     * Resolve authoritative commission settings associated with the product's owner entity.
     */
    public function getCommissionSettingsAttribute(): array
    {
        return EntityCommissionSetting::resolveForEntity($this->owner_type, $this->owner_name);
    }
}
