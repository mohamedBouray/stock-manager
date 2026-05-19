<?php
namespace App\Http\Middleware;
// CCC
use Closure;
use Illuminate\Http\Request;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        if ($user->is_blocked) {
            return response()->json(['message' => 'Compte bloqué'], 403);
        }

        $allowedRoles = empty($roles) ? ['admin'] : $roles;

        if (!in_array($user->role, $allowedRoles)) {
            return response()->json(['message' => 'Accès refusé — droits insuffisants'], 403);
        }

        return $next($request);
    }
}