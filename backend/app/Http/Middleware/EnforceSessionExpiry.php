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

        // 1. Authoritative Absolute Session Lifetime Check (Default: 12 Hours)
        if ($token->isAbsoluteExpired()) {
            $token->delete();

            return response()->json([
                'status' => 'error',
                'message' => 'Your session has expired. Please login again.',
                'session_expired' => true,
                'expiry_type' => 'absolute',
            ], 401);
        }

        // 2. Authoritative Inactivity Timeout Check (Default: 30 Minutes)
        if ($token->isIdleExpired()) {
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
