<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->validateCsrfTokens(except: [
            'entity/*',
            'api/*',
        ]);

        $middleware->api(prepend: [
            \App\Http\Middleware\EnforceSessionExpiry::class,
        ]);

        $middleware->alias([
            'session.expiry' => \App\Http\Middleware\EnforceSessionExpiry::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Intercept and sanitize any database query exceptions across API & Entity endpoints
        $exceptions->render(function (\Illuminate\Database\QueryException $e, \Illuminate\Http\Request $request) {
            \Illuminate\Support\Facades\Log::error('Database QueryException encountered: ' . $e->getMessage(), [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'ip' => $request->ip(),
            ]);

            if ($request->is('api/*') || $request->is('entity/*') || $request->expectsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Service temporarily unavailable. Please try again shortly.',
                ], 503);
            }
        });

        // Intercept and sanitize low-level PDO exceptions (e.g. MySQL connection failures / access denied)
        $exceptions->render(function (\PDOException $e, \Illuminate\Http\Request $request) {
            \Illuminate\Support\Facades\Log::error('Database PDOException encountered: ' . $e->getMessage(), [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'ip' => $request->ip(),
            ]);

            if ($request->is('api/*') || $request->is('entity/*') || $request->expectsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Service temporarily unavailable. Please try again shortly.',
                ], 503);
            }
        });
    })->create();

