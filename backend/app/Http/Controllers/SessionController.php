<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\PersonalAccessToken;

class SessionController extends Controller
{
    /**
     * Authenticated Session Heartbeat & Activity Sync
     */
    public function ping(Request $request)
    {
        $bearerToken = $request->bearerToken();
        if (!$bearerToken) {
            return response()->json([
                'status' => 'error',
                'message' => 'No session token provided',
            ], 401);
        }

        $token = PersonalAccessToken::findToken($bearerToken);
        if (!$token) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or revoked session token',
                'session_expired' => true,
            ], 401);
        }

        // Force touch activity timestamp on explicit ping
        $token->touchActivity(force: true);

        $idleTimeoutMinutes = (int) config('session_timeout.idle_timeout_minutes', 30);
        $absoluteTimeoutHours = (int) config('session_timeout.absolute_timeout_hours', 12);

        $now = Carbon::now();
        $idleElapsed = $token->last_activity_at ? $now->diffInSeconds($token->last_activity_at) : 0;
        $absoluteElapsed = $token->created_at ? $now->diffInSeconds($token->created_at) : 0;

        $idleRemaining = max(0, ($idleTimeoutMinutes * 60) - $idleElapsed);
        $absoluteRemaining = max(0, ($absoluteTimeoutHours * 3600) - $absoluteElapsed);

        return response()->json([
            'status' => 'success',
            'message' => 'Session active',
            'idle_timeout_minutes' => $idleTimeoutMinutes,
            'absolute_timeout_hours' => $absoluteTimeoutHours,
            'idle_remaining_seconds' => $idleRemaining,
            'absolute_remaining_seconds' => $absoluteRemaining,
            'server_time' => $now->toIso8601String(),
        ]);
    }

    /**
     * Get Centralized Session Expiry Configuration
     */
    public function config()
    {
        return response()->json([
            'status' => 'success',
            'idle_timeout_minutes' => (int) config('session_timeout.idle_timeout_minutes', 30),
            'absolute_timeout_hours' => (int) config('session_timeout.absolute_timeout_hours', 12),
            'remember_me_enabled' => (bool) config('session_timeout.remember_me_enabled', false),
        ]);
    }
}
