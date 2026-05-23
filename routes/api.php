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

use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\CommandeController;
use App\Http\Controllers\Admin\SuiviController;
use App\Http\Controllers\Admin\StockController;
use App\Http\Controllers\Admin\RapportController;
use App\Http\Controllers\Admin\ExportController;
use App\Http\Controllers\Admin\CommandeAutoController;
use App\Http\Controllers\Admin\ScanController;
use App\Http\Controllers\Admin\RetourController;
use App\Http\Controllers\Admin\InventaireController;
use App\Http\Controllers\Admin\TransfertController;
use App\Http\Controllers\Admin\LogController;
use App\Http\Controllers\Admin\MaintenanceController;
use App\Http\Controllers\Admin\SettingsController;

use App\Http\Controllers\Commun\ArticleController;

use App\Http\Controllers\User\DemandeController;
use App\Http\Controllers\User\StockController as UserStockController;
use App\Http\Controllers\User\ReservationController as UserReservationController;

use App\Http\Controllers\Magasinier\DemandeController as MagasinierDemandeController;
use App\Http\Controllers\Magasinier\ReservationController as MagasinierReservationController;
use App\Http\Controllers\Magasinier\MouvementController as MagasinierMouvementController;
use App\Http\Controllers\Magasinier\MagasinController;
use App\Http\Controllers\Magasinier\RetourController as MagasinierRetourController;
use App\Http\Controllers\Magasinier\AlerteController;
use App\Http\Controllers\Magasinier\InventaireController as MagasinierInventaireController;
use App\Http\Controllers\Magasinier\BonReceptionController;

use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;

// ==================== ROUTES PUBLIQUES ====================

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

// ==================== ROUTES PROTÉGÉES ====================

Route::middleware(['auth:sanctum'])->group(function () {
    
    // ==================== AUTH & PROFIL ====================
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
    
    Route::get('/user', [ProfileController::class, 'show']);
    Route::put('/user/profile', [ProfileController::class, 'update']);
    Route::post('/user/upload-avatar', [ProfileController::class, 'uploadAvatar']);
    Route::delete('/user/avatar', [ProfileController::class, 'deleteAvatar']);
    Route::post('/user/change-password', [ProfileController::class, 'changePassword']);
    Route::get('/user/stats', [ProfileController::class, 'stats']);

    // ==================== EMAIL VERIFICATION ====================
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

    // ==================== MESSAGES & NOTIFICATIONS ====================
    Route::get('/messages/{demandeId}', [MessageController::class, 'getConversation']);
    Route::post('/messages/{demandeId}', [MessageController::class, 'sendMessage']);
    
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
    });




    // ==================== ROUTES ADMIN ====================
    Route::prefix('admin')->group(function () {
        Route::put('/users/{id}/magasin', [AdminUserController::class, 'updateMagasin']);
        Route::get('/magasiniers-affectation', [AdminUserController::class, 'getMagasiniersWithMagasin']);

        // ---------- Gestion des Utilisateurs ----------
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{id}', [AdminUserController::class, 'show']);
        Route::post('/users', [AdminUserController::class, 'store']);
        Route::put('/users/{id}', [AdminUserController::class, 'update']);
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
        Route::post('/users/{id}/block', [AdminUserController::class, 'block']);
        Route::post('/users/{id}/unblock', [AdminUserController::class, 'unblock']);
        Route::post('/users/{id}/reset-password', [AdminUserController::class, 'resetPassword'])->name('admin.users.reset-password');
        Route::get('/users/{id}/activities', [AdminUserController::class, 'activities']);
        Route::get('/users/export', [AdminUserController::class, 'export']);
        Route::get('/system/stats', [AdminUserController::class, 'systemStats']);

        // ---------- Gestion du Catalogue ----------
        Route::get('/catalogue-structure', [ArticleController::class, 'getCatalogueStructure']);
        Route::post('/magasins', [ArticleController::class, 'storeMagasin']);
        Route::post('/articles', [ArticleController::class, 'store']);
        Route::post('/familles', [ArticleController::class, 'storeFamille']);
        Route::post('/categories', [ArticleController::class, 'storeCategorie']);
        Route::post('/articles/{id}/block', [ArticleController::class, 'toggleBlock']);

        // ---------- Gestion des Commandes Fournisseurs ----------
        Route::post('/commandes', [CommandeController::class, 'store']);
        Route::get('/commandes', [CommandeController::class, 'index']);
        Route::get('/commandes/en-attente', [CommandeController::class, 'getCommandesEnAttente']);
        Route::post('/commandes/{id}/traiter', [CommandeController::class, 'traiterCommande']);


        Route::get('/transferts', [App\Http\Controllers\Admin\TransfertController::class, 'index']);
        Route::post('/transferts', [App\Http\Controllers\Admin\TransfertController::class, 'store']);
        Route::get('/transferts/{id}', [App\Http\Controllers\Admin\TransfertController::class, 'show']);

        // ---------- Suivi & Alertes ----------
        Route::get('/suivi-alertes', [SuiviController::class, 'getSuiviData']);

        // ---------- Gestion des Stocks ----------
        Route::prefix('stocks')->group(function () {
            Route::get('/', [StockController::class, 'index']);
            Route::get('/alertes', [StockController::class, 'alertes']);
            Route::put('/{id}', [StockController::class, 'update']);
            Route::post('/entree', [StockController::class, 'entree']);
            Route::post('/sortie', [StockController::class, 'sortie']);
            Route::post('/transfert', [StockController::class, 'transfert']);
        });
        
        // ---------- Mouvements Récents ----------
        Route::get('/mouvements/recent', [StockController::class, 'recentMouvements']);

        // ---------- Rapports ----------
         Route::prefix('rapports')->group(function () {
            Route::get('/mission', [RapportController::class, 'mission']);
            Route::get('/mouvements-journaliers', [RapportController::class, 'mouvementsJournaliers']);
            Route::get('/approvisionnements', [RapportController::class, 'approvisionnements']);
            Route::get('/sorties', [RapportController::class, 'sorties']);
            Route::get('/fiche-stock/{article_id}', [RapportController::class, 'ficheStock']);
            Route::get('/alertes', [RapportController::class, 'alertesPdf']);
        });
    
        // 📤 Export
        Route::prefix('export')->group(function () {
            Route::get('/articles', [ExportController::class, 'exportArticles']);
            Route::get('/stocks-csv', [ExportController::class, 'exportStocksCsv']);
            Route::get('/alertes-pdf', [RapportController::class, 'alertesPdf']);
        });
        
        // ---------- Commandes Automatiques ----------
        Route::post('/commandes-auto/generer', [CommandeAutoController::class, 'generer']);
        Route::post('/commandes-auto/configurer', [CommandeAutoController::class, 'configurer']);
        
        // ---------- Scan Code-Barres ----------
        Route::prefix('scan')->group(function () {
            Route::post('/', [ScanController::class, 'scanner']);
            Route::post('/entree-rapide', [ScanController::class, 'entreeRapide']);
            Route::post('/sortie-rapide', [ScanController::class, 'sortieRapide']);
            Route::post('/transfert-rapide', [ScanController::class, 'transfertRapide']);
        });
        
        // ---------- Retours Magasin ----------
        Route::prefix('retours')->group(function () {
            Route::get('/', [RetourController::class, 'index']);
            Route::post('/', [RetourController::class, 'store']);
            Route::post('/{id}/approuver', [RetourController::class, 'approuver']);
            Route::post('/{id}/refuser', [RetourController::class, 'refuser']);
        });
        
        // ---------- Inventaires ----------
        Route::prefix('inventaires')->group(function () {
            Route::get('/', [InventaireController::class, 'index']);
            Route::post('/', [InventaireController::class, 'store']);
            Route::get('/{id}', [InventaireController::class, 'show']);
            Route::post('/{id}/start', [InventaireController::class, 'start']);
            Route::post('/{id}/finalize', [InventaireController::class, 'finalize']);
        });
        
        // ---------- Transferts ----------
        Route::get('/transferts', [TransfertController::class, 'index']);
        Route::post('/transferts', [TransfertController::class, 'store']);
        
        // ---------- Logs Système ----------
        // Route::get('/logs', [LogController::class, 'index']);
        
        // // ---------- Maintenance ----------
        // Route::prefix('maintenance')->group(function () {
        //     Route::get('/backup', [MaintenanceController::class, 'backup']);
        //     Route::post('/clear-cache', [MaintenanceController::class, 'clearCache']);
        //     Route::post('/optimize', [MaintenanceController::class, 'optimize']);
        // });
        
        // ---------- Paramètres ----------
        Route::get('/settings/general', [SettingsController::class, 'general']);
        Route::get('/settings/stock', [SettingsController::class, 'stock']);
        Route::get('/settings/notifications', [SettingsController::class, 'notifications']);
        Route::get('/settings/backup', [SettingsController::class, 'backup']);
        Route::post('/settings/{group}', [SettingsController::class, 'update']);
        Route::post('/settings/{group}/reset', [SettingsController::class, 'reset']);
    });











    // ==================== ROUTES MAGASINIER ====================
    Route::prefix('magasinier')->group(function () {
        
        // ---------- Demandes ----------
        Route::get('/demandes', [MagasinierDemandeController::class, 'index']);
        Route::post('/demandes/{id}/approuver', [MagasinierDemandeController::class, 'approuver']);
        Route::post('/demandes/{id}/refuser', [MagasinierDemandeController::class, 'refuser']);
        Route::post('/demandes/{id}/livrer', [MagasinierDemandeController::class, 'livrer']);
        
        // ---------- Réservations ----------
        Route::get('/reservations', [MagasinierReservationController::class, 'index']);
        Route::post('/reservations/{id}/confirmer', [MagasinierReservationController::class, 'confirmer']);
        Route::post('/reservations/{id}/annuler', [MagasinierReservationController::class, 'annuler']);
        Route::get('/reservations/{id}', [MagasinierReservationController::class, 'show']);
        
        // ---------- Retours ----------
        Route::get('/retours', [MagasinierRetourController::class, 'index']);

        Route::prefix('retours')->group(function () {
            Route::get('/', [App\Http\Controllers\Magasinier\RetourController::class, 'index']);
            Route::post('/{id}/approuver', [App\Http\Controllers\Magasinier\RetourController::class, 'approuver']);
            Route::post('/{id}/refuser', [App\Http\Controllers\Magasinier\RetourController::class, 'refuser']);
            Route::get('/{id}', [App\Http\Controllers\Magasinier\RetourController::class, 'show']);
        });
        
        // ---------- Magasins ----------
        Route::get('/magasins', [MagasinController::class, 'index']);
        Route::get('/stocks', [App\Http\Controllers\Magasinier\StockController::class, 'index']);


        Route::prefix('scan')->group(function () {
            Route::post('/', [App\Http\Controllers\Magasinier\ScanController::class, 'scanner']);
            Route::post('/entree-rapide', [App\Http\Controllers\Magasinier\ScanController::class, 'entreeRapide']);
            Route::post('/sortie-rapide', [App\Http\Controllers\Magasinier\ScanController::class, 'sortieRapide']);
        });
        // ---------- Mouvements de Stock ----------
        Route::prefix('mouvements')->group(function () {
            Route::get('/', [MagasinierMouvementController::class, 'index']);
            Route::get('/stats', [MagasinierMouvementController::class, 'stats']);
            Route::post('/entree', [MagasinierMouvementController::class, 'entree']);
            Route::post('/sortie', [MagasinierMouvementController::class, 'sortie']);
            Route::post('/ajustement', [MagasinierMouvementController::class, 'ajustement']);
        });
        Route::get('/inventaire/actuel', [App\Http\Controllers\Magasinier\InventaireController::class, 'actuel']);
        Route::post('/inventaire/{id}/save', [App\Http\Controllers\Magasinier\InventaireController::class, 'save']);
        Route::post('/inventaire/{id}/finaliser', [App\Http\Controllers\Magasinier\InventaireController::class, 'finaliser']);
        
        Route::get('/alertes', [App\Http\Controllers\Magasinier\AlerteController::class, 'index']);

        // ---------- Bons de Réception ----------
        Route::get('/bons-reception', [App\Http\Controllers\Magasinier\BonReceptionController::class, 'index']);
        Route::get('/bons-reception/{id}', [App\Http\Controllers\Magasinier\BonReceptionController::class, 'show']);
    });





    // ==================== ROUTES DEMANDEUR (USER) ====================
    Route::prefix('user')->group(function () {
        // ---------- Demandes ----------
        Route::prefix('demandes')->group(function () {
            Route::get('/', [DemandeController::class, 'index']);
            Route::post('/', [DemandeController::class, 'store']);
            Route::get('/{id}', [DemandeController::class, 'show']);
            Route::put('/{id}', [DemandeController::class, 'update']);
            Route::delete('/{id}', [DemandeController::class, 'destroy']);
            Route::post('/{id}/archive', [DemandeController::class, 'archive']);
            Route::get('/archives/list', [DemandeController::class, 'getArchives']);
            Route::get('/{id}/pdf', [DemandeController::class, 'exportPDF']);
            Route::get('/{id}/bon-livraison', [DemandeController::class, 'bonLivraison']);
        });

        // ---------- Consultation Stock ----------
        Route::prefix('stock')->group(function () {
            Route::get('/articles', [UserStockController::class, 'index']);
            Route::get('/articles/{id}', [UserStockController::class, 'show']);
            Route::get('/familles', [UserStockController::class, 'familles']);
            Route::get('/categories', [UserStockController::class, 'categories']);
            Route::get('/stats', [UserStockController::class, 'stats']);
        });

        // ---------- Réservations ----------
        Route::prefix('reservations')->group(function () {
            Route::get('/', [UserReservationController::class, 'index']);
            Route::post('/', [UserReservationController::class, 'store']);
            Route::delete('/{id}', [UserReservationController::class, 'destroy']);
        });

        // Retours
        Route::prefix('retours')->group(function () {
            Route::get('/', [App\Http\Controllers\User\RetourController::class, 'index']);
            Route::post('/', [App\Http\Controllers\User\RetourController::class, 'store']);
            Route::get('/{id}', [App\Http\Controllers\User\RetourController::class, 'show']);
        });
    });

});