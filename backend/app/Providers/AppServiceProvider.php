<?php

namespace App\Providers;

use Firebase\JWT\JWT;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;
use App\Models\PersonalAccessToken;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Use custom PersonalAccessToken model for database-backed session activity tracking
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        // Bounded 60-second leeway to tolerate reasonable clock skew between OAuth identity providers (e.g. Google) and host system
        if (class_exists(JWT::class)) {
            JWT::$leeway = 60;
        }
    }
}
