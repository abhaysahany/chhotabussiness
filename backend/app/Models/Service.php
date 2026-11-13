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
}
