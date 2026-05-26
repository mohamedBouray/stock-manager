<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json([
                'message' => 'Email ou mot de passe incorrect'
            ], 422);
        }
        
        if (!Hash::check($request->password, $user->password)) {
            $user->incrementLoginAttempts();
            return response()->json([
                'message' => 'Email ou mot de passe incorrect'
            ], 422);
        }
        
        if ($user->is_blocked) {
            return response()->json([
                'message' => '⛔ Votre compte a été bloqué par l\'administrateur. Veuillez contacter le support.'
            ], 403); 
        }

        if ($user->isLocked()) {
            $remaining = $user->getRemainingLockoutTime();
            return response()->json([
                'message' => "⏰ Compte verrouillé. Réessayez dans {$remaining} minutes."
            ], 423); 
        }


        $user->updateLastLogin();
        
        $token = $user->createToken('auth_token')->plainTextToken;
        
        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Connexion réussie'
        ]);
    }
    

    /**
     * Destroy an authenticated session (Logout).
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie'
        ]);
    }
}