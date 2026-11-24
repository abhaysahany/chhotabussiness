<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\PersonalAccessToken;

class EnforceSessionExpiry
{
    /**
     * Handle an incoming request.
     * Enforces authoritative backend inactivity timeout and absolute session lifetime.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $bearerToken = $request->bearerToken();

        // If no bearer token is attached, proceed normally (unauthenticated or public routes)
        if (!$bearerToken) {
            return $next($request);
        }

        // Locate token in database
        $token = PersonalAccessToken::findToken($bearerToken);

        // If token not found in database, allow request to proceed so Sanctum can handle rejection
        if (!$token) {
            return $next($request);
        }

        // Mobile App requests and persistent sessions must NEVER expire due to inactivity or absolute timeouts
        $isMobileApp = $request->header('X-Client-Type') === 'mobile-app'
            || $request->header('X-Mobile-App') === '1'
            || ($token->name ?? '') === 'mobile_auth_token'
            || str_contains(strtolower($request->userAgent() ?? ''), 'dart')
            || str_contains(strtolower($request->userAgent() ?? ''), 'flutter');

        if ($isMobileApp) {
            $token->touchActivity();
            return $next($request);
        }

        $absoluteLimit = (int) config('session_timeout.absolute_timeout_hours', 2);
        // 1. Authoritative Absolute Session Lifetime Check (Disabled if <= 0)
        if ($absoluteLimit > 0 && $token->isAbsoluteExpired($absoluteLimit)) {
            $token->delete();

            return response()->json([
                'status' => 'error',
                'message' => 'Your session has expired. Please login again.',
                'session_expired' => true,
                'expiry_type' => 'absolute',
            ], 401);
        }

        $idleLimit = (int) config('session_timeout.idle_timeout_minutes', 120);
        // 2. Authoritative Inactivity Timeout Check (Disabled if <= 0)
        if ($idleLimit > 0 && $token->isIdleExpired($idleLimit)) {
            $token->delete();

            return response()->json([
                'status' => 'error',
                'message' => 'Your session has expired due to inactivity. Please login again.',
                'session_expired' => true,
                'expiry_type' => 'idle',
            ], 401);
        }

        // 3. Genuine User Activity Refresh
        // Background polling, automatic dashboard refreshes, and silent requests MUST NOT extend the idle timeout.
        // Only deliberate user actions (requests carrying X-User-Activity or state-changing writes) refresh activity.
        if ($this->isGenuineUserActivity($request)) {
            $token->touchActivity();
        }

        return $next($request);
    }

    /**
     * Determine whether an incoming request represents genuine user interaction.
     */
    protected function isGenuineUserActivity(Request $request): bool
    {
        // Explicit heartbeat/ping endpoint from active frontend interaction
        if ($request->is('api/session/ping') || $request->is('api/auth/ping')) {
            return true;
        }

        // Explicit header sent by frontend when request was triggered by genuine user action
        if ($request->header('X-User-Activity') === '1' || strtolower($request->header('X-User-Activity', '')) === 'true') {
            return true;
        }

        // Deliberate mutation operations (POST/PUT/PATCH/DELETE) are genuine actions,
        // unless explicitly marked as background/silent
        if (in_array(strtoupper($request->method()), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            // Do not refresh on logout
            if ($request->is('api/logout') || $request->is('api/admin/logout') || $request->is('api/entity/logout')) {
                return false;
            }

            return true;
        }

        return false;
    }
}
