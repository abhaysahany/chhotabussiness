<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class FreelancerEntity extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $table = 'freelancer_entities';

    protected $fillable = [
        'entity_category_id',
        'name',
        'email',
        'phone',
        'password',
        'title',
        'experience_years',
        'hourly_rate',
        'bio',
        'avatar_url',
        'portfolio_link',
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
     * Get the category that owns the freelancer.
     */
    public function category()
    {
        return $this->belongsTo(EntityCategory::class, 'entity_category_id');
    }
}
