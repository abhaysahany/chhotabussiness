<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserUpiAccount extends Model
{
    use HasFactory;

    protected $table = 'user_upi_accounts';

    protected $fillable = [
        'user_id',
        'user_code',
        'upi_id',
        'holder_name',
        'qr_code_image',
        'is_primary',
        'is_verified',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_verified' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
