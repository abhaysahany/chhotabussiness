<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessEntity extends Model
{
    use HasFactory;

    protected $fillable = [
        'entity_category_id',
        'name',
        'owner_name',
        'email',
        'phone',
        'password',
        'address',
        'registration_no',
        'description',
        'logo_url',
        'website',
        'verification_status',
        'featured',
        'documents',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'documents' => 'array',
        'featured' => 'boolean',
        'password' => 'hashed',
    ];

    /**
     * Get the category that owns the business.
     */
    public function category()
    {
        return $this->belongsTo(EntityCategory::class, 'entity_category_id');
    }

    /**
     * Get commission & reward settings for this business entity.
     */
    public function commissionSetting()
    {
        return $this->hasOne(EntityCommissionSetting::class, 'entity_id')
                    ->where('entity_type', 'business');
    }
}
