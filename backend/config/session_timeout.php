<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Session Inactivity Timeout (Minutes)
    |--------------------------------------------------------------------------
    |
    | Number of minutes of genuine inactivity before a session/token is considered
    | expired. Set to 0 to disable inactivity expiration entirely.
    | Default: 120 minutes (2 hours).
    |
    */
    'idle_timeout_minutes' => (int) env('AUTH_IDLE_TIMEOUT_MINUTES', 120),

    /*
    |--------------------------------------------------------------------------
    | Maximum Absolute Session Lifetime (Hours)
    |--------------------------------------------------------------------------
    |
    | Maximum absolute session duration in hours from the moment of authentication.
    | Set to 0 to disable absolute session limit.
    | Default: 2 hours (120 minutes).
    |
    */
    'absolute_timeout_hours' => (int) env('AUTH_ABSOLUTE_TIMEOUT_HOURS', 2),

    /*
    |--------------------------------------------------------------------------
    | Remember Me Policy
    |--------------------------------------------------------------------------
    |
    | Disabled by default. Remember me must never grant infinite or non-expiring
    | tokens. Even when enabled, sessions must respect absolute limits.
    |
    */
    'remember_me_enabled' => (bool) env('AUTH_REMEMBER_ME_ENABLED', false),

    /*
    |--------------------------------------------------------------------------
    | Heartbeat Ping Throttle (Seconds)
    |--------------------------------------------------------------------------
    |
    | Minimum seconds required between database activity timestamp updates to prevent
    | unnecessary query overhead from rapid user interactions.
    |
    */
    'activity_touch_throttle_seconds' => (int) env('AUTH_ACTIVITY_TOUCH_THROTTLE_SECONDS', 15),
];
