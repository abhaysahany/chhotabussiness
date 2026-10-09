<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EntityCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'badge_color',
        'status',
    ];

    /**
     * Get the businesses registered under this category.
     */
    public function businesses()
    {
        return $this->hasMany(BusinessEntity::class);
    }

    /**
     * Get the freelancers registered under this category.
     */
    public function freelancers()
    {
        return $this->hasMany(FreelancerEntity::class);
    }
}
