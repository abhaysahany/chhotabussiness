<?php

namespace App\Providers;

use Firebase\JWT\JWT;
use Illuminate\Support\ServiceProvider;

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
        // Bounded 60-second leeway to tolerate reasonable clock skew between OAuth identity providers (e.g. Google) and host system
        if (class_exists(JWT::class)) {
            JWT::$leeway = 60;
        }
    }
}
