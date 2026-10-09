<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductPackage extends Model
{
    use HasFactory;

    protected $table = 'packages';

    protected $fillable = [
        'name',
        'price',
        'commission_percent',
        'description',
        'items_included',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'commission_percent' => 'decimal:2',
        'items_included' => 'array',
    ];
}
