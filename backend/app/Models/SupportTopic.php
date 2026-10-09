<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportTopic extends Model
{
    use HasFactory;

    protected $table = 'support_topics';

    protected $fillable = [
        'title',
        'category',
        'youtube_url',
        'thumbnail',
        'summary',
        'article_body',
        'faq_question',
        'faq_answer',
        'views',
        'helpful_count',
        'status',
    ];

    protected $casts = [
        'views' => 'integer',
        'helpful_count' => 'integer',
    ];
}
