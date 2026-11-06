<?php

namespace App\Models;

use Carbon\Carbon;
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'abilities' => 'json',
        'last_used_at' => 'datetime',
        'last_activity_at' => 'datetime',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted()
    {
        static::creating(function ($token) {
            if (!$token->last_activity_at) {
                $token->last_activity_at = Carbon::now();
            }
        });
    }

    /**
     * Determine if the token has expired due to genuine user inactivity.
     *
     * @param int|null $timeoutMinutes
     * @return bool
     */
    public function isIdleExpired(?int $timeoutMinutes = null): bool
    {
        $limit = $timeoutMinutes ?? (int) config('session_timeout.idle_timeout_minutes', 30);
        if ($limit <= 0) {
            return false;
        }

        $baseline = $this->last_activity_at ?? $this->created_at;
        if (!$baseline) {
            return false;
        }

        return Carbon::now()->greaterThanOrEqualTo(Carbon::parse($baseline)->addMinutes($limit));
    }

    /**
     * Determine if the token has reached its absolute maximum lifetime.
     *
     * @param int|null $timeoutHours
     * @return bool
     */
    public function isAbsoluteExpired(?int $timeoutHours = null): bool
    {
        $limit = $timeoutHours ?? (int) config('session_timeout.absolute_timeout_hours', 12);
        if ($limit <= 0) {
            return false;
        }

        if (!$this->created_at) {
            return false;
        }

        return Carbon::now()->greaterThanOrEqualTo(Carbon::parse($this->created_at)->addHours($limit));
    }

    /**
     * Update the genuine user activity timestamp safely with throttling.
     *
     * @param bool $force
     * @return void
     */
    public function touchActivity(bool $force = false): void
    {
        $throttle = (int) config('session_timeout.activity_touch_throttle_seconds', 15);
        $now = Carbon::now();

        if ($force || !$this->last_activity_at || Carbon::parse($this->last_activity_at)->addSeconds($throttle)->lessThanOrEqualTo($now)) {
            $this->forceFill(['last_activity_at' => $now])->save();
        }
    }
}
