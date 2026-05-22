<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;

use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Auth\CodeVerificationController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;

use App\Models\User;
use App\Http\Controllers\ProfileController; 
use App\Http\Controllers\Admin\SettingsController; 
use App\Http\Controllers\Admin\AdminUserController;


use App\Http\Controllers\User\DemandeController;
use App\Http\Controllers\User\StockController;
use App\Http\Controllers\User\ReservationController;



Route::get('/check-db-status', function () {
    $hasUsers = User::exists();
    return response()->json(['has_users' => $hasUsers]);
});

Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/forgot-password', [PasswordResetLinkController::class, 'store']);
Route::post('/reset-password', [NewPasswordController::class, 'store']);

Route::get('/verify-email/{id}/{hash}', VerifyEmailController::class)
    ->middleware(['signed', 'throttle:6,1']) 
    ->name('verification.verify');

Route::middleware(['auth:sanctum'])->group(function () {
    
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
    
    Route::get('/user', [ProfileController::class, 'show']);
    Route::put('/user/profile', [ProfileController::class, 'update']);
    Route::post('/user/upload-avatar', [ProfileController::class, 'uploadAvatar']);
    Route::delete('/user/avatar', [ProfileController::class, 'deleteAvatar']);
    Route::post('/user/change-password', [ProfileController::class, 'changePassword']);
    Route::get('/user/stats', [ProfileController::class, 'stats']);

    Route::post('/email/verification-notification', function (Request $request) {
        $user = Auth::guard('sanctum')->user() ?: $request->user(); 
        if (!$user) {return response()->json(['message' => 'User not found or token invalid'], 401);}
        if ($user->hasVerifiedEmail()) { return response()->json(['message' => 'Email already verified'], 200); }
        $user->sendEmailVerificationNotification();
        return response()->json(['status' => 'verification-link-sent'], 200);
    });

    Route::post('/email/verify-code', [CodeVerificationController::class, 'verify']);
    Route::post('/email/resend-code', [CodeVerificationController::class, 'resend']);


    Route::get('/messages/{demandeId}', [App\Http\Controllers\Api\MessageController::class, 'getConversation']);
    Route::post('/messages/{demandeId}', [App\Http\Controllers\Api\MessageController::class, 'sendMessage']);
    Route::prefix('notifications')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\NotificationController::class, 'index']);
        Route::get('/unread-count', [App\Http\Controllers\Api\NotificationController::class, 'unreadCount']);
        Route::post('/{id}/read', [App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
        Route::post('/read-all', [App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
    });

    Route::prefix('admin')->group(function () {
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
        Route::get('/users/export', [AdminUserController::class, 'export']);
        Route::get('/system/stats', [AdminUserController::class, 'systemStats']);



        // // Settings
        // Route::get('/settings/general',       [SettingsController::class, 'general']);
        // Route::get('/settings/stock',         [SettingsController::class, 'stock']);
        // Route::get('/settings/notifications', [SettingsController::class, 'notifications']);
        // Route::get('/settings/backup',        [SettingsController::class, 'backup']);
        // Route::post('/settings/{group}',      [SettingsController::class, 'update']);
        // Route::post('/settings/{group}/reset',[SettingsController::class, 'reset']);
    });
// Routes pour Magasinier
    Route::prefix('magasinier')->group(function () {
        
        // Demandes
        Route::get('/demandes', [App\Http\Controllers\Magasinier\DemandeController::class, 'index']);
        Route::post('/demandes/{id}/approuver', [App\Http\Controllers\Magasinier\DemandeController::class, 'approuver']);
        Route::post('/demandes/{id}/refuser', [App\Http\Controllers\Magasinier\DemandeController::class, 'refuser']);
        Route::post('/demandes/{id}/livrer', [App\Http\Controllers\Magasinier\DemandeController::class, 'livrer']);
        // ✅ RÉSERVATIONS - AJOUTER CECI
        Route::get('/reservations', [App\Http\Controllers\Magasinier\ReservationController::class, 'index']);
        Route::post('/reservations/{id}/confirmer', [App\Http\Controllers\Magasinier\ReservationController::class, 'confirmer']);
        Route::post('/reservations/{id}/annuler', [App\Http\Controllers\Magasinier\ReservationController::class, 'annuler']);
        Route::get('/reservations/{id}', [App\Http\Controllers\Magasinier\ReservationController::class, 'show']);

        Route::get('/magasins', [App\Http\Controllers\Magasinier\MagasinController::class, 'index']);
            
            // Mouvements de stock
            Route::prefix('mouvements')->group(function () {
                Route::get('/', [App\Http\Controllers\Magasinier\MouvementController::class, 'index']);
                Route::get('/stats', [App\Http\Controllers\Magasinier\MouvementController::class, 'stats']);
                Route::post('/entree', [App\Http\Controllers\Magasinier\MouvementController::class, 'entree']);
                Route::post('/sortie', [App\Http\Controllers\Magasinier\MouvementController::class, 'sortie']);
                Route::post('/ajustement', [App\Http\Controllers\Magasinier\MouvementController::class, 'ajustement']);
            });


    });











    Route::prefix('user')->group(function () {
        
        // 📦 1. Gestion des Demandes
        Route::prefix('demandes')->group(function () {
            Route::get('/', [DemandeController::class, 'index']);          // Liste mes demandes
            Route::post('/', [DemandeController::class, 'store']);         // Créer une demande
            Route::get('/{id}', [DemandeController::class, 'show']);       // Voir une demande
            Route::put('/{id}', [DemandeController::class, 'update']);     // Modifier une demande
            Route::delete('/{id}', [DemandeController::class, 'destroy']); // Annuler une demande

            Route::post('/{id}/archive', [DemandeController::class, 'archive']);
            Route::get('/archives/list', [DemandeController::class, 'getArchives']);
            Route::get('/{id}/pdf', [DemandeController::class, 'exportPDF']);

            Route::get('/{id}/bon-livraison', [DemandeController::class, 'bonLivraison']);
        });
        
        // 📦 2. Consultation Stock (Lecture seule)
        Route::prefix('stock')->group(function () {
            Route::get('/articles', [StockController::class, 'index']);     // Liste des articles
            Route::get('/articles/{id}', [StockController::class, 'show']); // Détail d'un article
            Route::get('/familles', [StockController::class, 'familles']);  // Liste des familles
            Route::get('/categories', [StockController::class, 'categories']); // Liste des catégories
            Route::get('/stats', [StockController::class, 'stats']);        // Statistiques stock
        });
        
        // 📦 3. Gestion des Réservations
        Route::prefix('reservations')->group(function () {
            Route::get('/', [ReservationController::class, 'index']);       // Liste mes réservations
            Route::post('/', [ReservationController::class, 'store']);      // Créer une réservation
            Route::delete('/{id}', [ReservationController::class, 'destroy']); // Annuler une réservation
            Route::get('/historique', [ReservationController::class, 'historique']);
        });
        

    });
    
});