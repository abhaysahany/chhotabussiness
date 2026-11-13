<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContentAsset extends Model
{
    use HasFactory;

    protected $table = 'content_assets';

    protected $fillable = [
        'title',
        'type',
        'category',
        'entity_type',
        'entity_name',
        'file_url',
        'thumbnail',
        'tags',
        'downloads',
        'shares',
        'status',
    ];

    protected $casts = [
        'downloads' => 'integer',
        'shares' => 'integer',
    ];
}
