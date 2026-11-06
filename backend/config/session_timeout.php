<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Session Inactivity Timeout (Minutes)
    |--------------------------------------------------------------------------
    |
    | Number of minutes of genuine inactivity before a session/token is considered
    | expired and automatically revoked. Default is 30 minutes.
    |
    */
    'idle_timeout_minutes' => (int) env('AUTH_IDLE_TIMEOUT_MINUTES', 30),

    /*
    |--------------------------------------------------------------------------
    | Maximum Absolute Session Lifetime (Hours)
    |--------------------------------------------------------------------------
    |
    | Maximum absolute session duration in hours from the moment of authentication,
    | regardless of ongoing user activity. Default is 12 hours.
    |
    */
    'absolute_timeout_hours' => (int) env('AUTH_ABSOLUTE_TIMEOUT_HOURS', 12),

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
