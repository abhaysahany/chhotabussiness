<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'user_code',
        'sponsor_id',
        'commission_balance',
        'bp_balance',
        'kyc_status',
        'pan_number',
        'aadhaar_number',
        'pan_card_image',
        'aadhaar_front_image',
        'aadhaar_back_image',
        'kyc_submitted_at',
        'kyc_verified_at',
        'bank_name',
        'account_number',
        'ifsc_code',
        'account_holder_name',
        'upi_id',
        'provider',
        'provider_id',
        'avatar',
        'rank',
        'status',
        'location',
        'personal_pv',
        'group_pv',
    ];

    public function payouts()
    {
        return $this->hasMany(UserPayout::class, 'user_id');
    }

    public function rewardClaims()
    {
        return $this->hasMany(RewardClaim::class, 'user_id');
    }

    public function bankAccounts()
    {
        return $this->hasMany(UserBankAccount::class, 'user_id');
    }

    public function upiAccounts()
    {
        return $this->hasMany(UserUpiAccount::class, 'user_id');
    }

    /**
     * Auto generate unique MLM user_code on creation
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if (empty($user->user_code)) {
                $latest = User::latest('id')->first();
                $nextId = $latest ? ($latest->id + 100001) : 100001;
                $user->user_code = 'CB' . $nextId;
            }
        });
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
