<?php
// CCC
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Auth\CodeVerificationController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;

use App\Http\Controllers\Admin\SettingsController; 
use App\Http\Controllers\Admin\AdminUserController;

// ✅ Route publique - Vérifier si des utilisateurs existent
Route::get('/check-db-status', function () {
    $hasUsers = User::exists();
    return response()->json(['has_users' => $hasUsers]);
});

// ✅ Routes publiques d'authentification
Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/forgot-password', [PasswordResetLinkController::class, 'store']);
Route::post('/reset-password', [NewPasswordController::class, 'store']);

// ✅ Route de vérification email (UNIQUE)
Route::get('/verify-email/{id}/{hash}', VerifyEmailController::class)
    ->middleware(['signed', 'throttle:6,1']) 
    ->name('verification.verify');

// ✅ Routes protégées par Sanctum
Route::middleware(['auth:sanctum'])->group(function () {
    
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/email/verification-notification', function (Request $request) {
        $user = Auth::guard('sanctum')->user() ?: $request->user(); 
        
        if (!$user) {
            return response()->json(['message' => 'User not found or token invalid'], 401);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified'], 200);
        }

        $user->sendEmailVerificationNotification();
        return response()->json(['status' => 'verification-link-sent'], 200);
    });

    Route::post('/email/verify-code', [CodeVerificationController::class, 'verify']);
    Route::post('/email/resend-code', [CodeVerificationController::class, 'resend']);

    Route::prefix('admin')->group(function () {

        // Settings
        Route::get('/settings/general',       [SettingsController::class, 'general']);
        Route::get('/settings/stock',         [SettingsController::class, 'stock']);
        Route::get('/settings/notifications', [SettingsController::class, 'notifications']);
        Route::get('/settings/backup',        [SettingsController::class, 'backup']);
        Route::post('/settings/{group}',      [SettingsController::class, 'update']);
        Route::post('/settings/{group}/reset',[SettingsController::class, 'reset']);

        // Users Management
        Route::get('/users',                        [AdminUserController::class, 'index']);
        Route::get('/users/{id}',                   [AdminUserController::class, 'show']);
        Route::post('/users',                       [AdminUserController::class, 'store']);
        Route::put('/users/{id}',                   [AdminUserController::class, 'update']);
        Route::delete('/users/{id}',                [AdminUserController::class, 'destroy']);
        Route::post('/users/{id}/block',            [AdminUserController::class, 'block']);
        Route::post('/users/{id}/unblock',          [AdminUserController::class, 'unblock']);
        Route::post('/users/{id}/reset-password', [AdminUserController::class, 'resetPassword'])->name('admin.users.reset-password');
        Route::get('/users/{id}/activities',        [AdminUserController::class, 'activities']);

        // System Stats
        Route::get('/system/stats', [AdminUserController::class, 'systemStats']);
    });
});