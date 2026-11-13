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
        'email_verified_at',
        'phone',
        'password',
        'user_code',
        'sponsor_id',
        'sponsor_onboarding_status',
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
        'dob',
        'gender',
        'address',
        'city',
        'state',
        'country',
        'zip_code',
        'bio',
        'rank',
        'status',
        'location',
        'personal_pv',
        'group_pv',
        'team_biz',
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

    public function directIncomes()
    {
        return $this->hasMany(DirectIncome::class, 'user_code', 'user_code');
    }

    public function directIncome()
    {
        return $this->hasOne(DirectIncome::class, 'user_code', 'user_code')->latestOfMany();
    }

    public function directIncomeOrderSummaries()
    {
        return $this->hasMany(DirectIncomeOrderSummary::class, 'user_id');
    }

    public function levelIncomes()
    {
        return $this->hasMany(LevelIncome::class, 'user_code', 'user_code');
    }

    public function diamondWallet()
    {
        return $this->hasOne(DiamondWallet::class, 'user_id');
    }

    public function diamondTransactions()
    {
        return $this->hasMany(DiamondTransaction::class, 'user_id');
    }

    public function totalLevelIncomes()
    {
        return $this->hasMany(TotalLevelIncome::class, 'user_code', 'user_code');
    }

    /**
     * Auto generate unique random MLM user_code on creation
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if (empty($user->user_code)) {
                $user->user_code = app(\App\Services\MemberIdGeneratorService::class)->generateUniqueCode();
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
            'kyc_submitted_at' => 'datetime',
            'kyc_verified_at' => 'datetime',
            'password' => 'hashed',
            'team_biz' => 'float',
            'commission_balance' => 'float',
            'bp_balance' => 'float',
            'personal_pv' => 'float',
            'group_pv' => 'float',
        ];
    }

    protected $appends = [
        'teamBiz',
        'has_pending_sponsor_onboarding',
        'avatar_url',
    ];

    public function getAvatarUrlAttribute(): ?string
    {
        $avatar = $this->attributes['avatar'] ?? null;
        if (empty($avatar)) {
            return null;
        }
        if (str_starts_with($avatar, 'http://') || str_starts_with($avatar, 'https://')) {
            return $avatar;
        }
        return url($avatar);
    }

    public function getTeamBizAttribute(): float
    {
        return (float) ($this->attributes['team_biz'] ?? 0);
    }

    public function getHasPendingSponsorOnboardingAttribute(): bool
    {
        return ($this->attributes['sponsor_onboarding_status'] ?? 'completed') === 'pending';
    }

    /**
     * Check if user is a new Google/social user who has not completed or skipped sponsor onboarding.
     */
    public function hasPendingSponsorOnboarding(): bool
    {
        return ($this->sponsor_onboarding_status ?? 'completed') === 'pending';
    }
}
