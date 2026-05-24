<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;

// ==================== CONTROLLERS AUTH ====================
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Auth\CodeVerificationController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;

// ==================== CONTROLLERS COMMUNS ====================
use App\Models\User;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Commun\ArticleController;

// ==================== CONTROLLERS ADMIN ====================
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\CommandeController;
use App\Http\Controllers\Admin\StockController;
use App\Http\Controllers\Admin\RapportController;
use App\Http\Controllers\Admin\ExportController;
use App\Http\Controllers\Admin\CommandeAutoController;
use App\Http\Controllers\Admin\ScanController;
use App\Http\Controllers\Admin\RetourController;
use App\Http\Controllers\Admin\InventaireController;
use App\Http\Controllers\Admin\TransfertController;
use app\Http\Controllers\Admin\AlertesController;
use App\Http\Controllers\Admin\SettingsController;

// ==================== CONTROLLERS MAGASINIER ====================
use App\Http\Controllers\Magasinier\DemandeController as MagasinierDemandeController;
use App\Http\Controllers\Magasinier\ReservationController as MagasinierReservationController;
use App\Http\Controllers\Magasinier\MouvementController as MagasinierMouvementController;
use App\Http\Controllers\Magasinier\MagasinController;
use App\Http\Controllers\Magasinier\RetourController as MagasinierRetourController;
use App\Http\Controllers\Magasinier\AlerteController;
use App\Http\Controllers\Magasinier\InventaireController as MagasinierInventaireController;
use App\Http\Controllers\Magasinier\BonReceptionController;
use App\Http\Controllers\Magasinier\StockController as MagasinierStockController;
use App\Http\Controllers\Magasinier\ScanController as MagasinierScanController;

// ==================== CONTROLLERS USER (DEMANDEUR) ====================
use App\Http\Controllers\User\DemandeController;
use App\Http\Controllers\User\StockController as UserStockController;
use App\Http\Controllers\User\ReservationController as UserReservationController;
use App\Http\Controllers\User\RetourController as UserRetourController;

// ==================== CONTROLLERS API ====================
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;

// ===================================================================
// ==================== ROUTES PUBLIQUES =============================
// ===================================================================

// Vérification de la base de données
Route::get('/check-db-status', function () {
    $hasUsers = User::exists();
    return response()->json(['has_users' => $hasUsers]);
});

// Authentification
Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/forgot-password', [PasswordResetLinkController::class, 'store']);
Route::post('/reset-password', [NewPasswordController::class, 'store']);

// Vérification email
Route::get('/verify-email/{id}/{hash}', VerifyEmailController::class)
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');

// ===================================================================
// ==================== ROUTES PROTÉGÉES (AUTH) =======================
// ===================================================================

Route::middleware(['auth:sanctum'])->group(function () {

    // ========================= AUTH & PROFIL =========================
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

    Route::get('/user', [ProfileController::class, 'show']);
    Route::put('/user/profile', [ProfileController::class, 'update']);
    Route::post('/user/upload-avatar', [ProfileController::class, 'uploadAvatar']);
    Route::delete('/user/avatar', [ProfileController::class, 'deleteAvatar']);
    Route::post('/user/change-password', [ProfileController::class, 'changePassword']);
    Route::get('/user/stats', [ProfileController::class, 'stats']);

    // ========================= EMAIL VERIFICATION =========================
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

    // ========================= MESSAGES & NOTIFICATIONS =========================
    Route::get('/messages/{demandeId}', [MessageController::class, 'getConversation']);
    Route::post('/messages/{demandeId}', [MessageController::class, 'sendMessage']);

    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
    });

    // ===================================================================
    // ==================== ROUTES ADMIN ==================================
    // ===================================================================

    Route::prefix('admin')->group(function () {

        // ---------------------- Gestion des Utilisateurs ----------------------
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{id}', [AdminUserController::class, 'show']);
        Route::post('/users', [AdminUserController::class, 'store']);
        Route::put('/users/{id}', [AdminUserController::class, 'update']);
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
        Route::post('/users/{id}/block', [AdminUserController::class, 'block']);
        Route::post('/users/{id}/unblock', [AdminUserController::class, 'unblock']);
        Route::post('/users/{id}/reset-password', [AdminUserController::class, 'resetPassword']);
        Route::get('/users/{id}/activities', [AdminUserController::class, 'activities']);
        Route::get('/users/export', [AdminUserController::class, 'export']);
        Route::get('/system/stats', [AdminUserController::class, 'systemStats']);

        // ---------------------- Affectation Magasins ----------------------
        Route::put('/users/{id}/magasin', [AdminUserController::class, 'updateMagasin']);
        Route::get('/magasiniers-affectation', [AdminUserController::class, 'getMagasiniersWithMagasin']);

        // ---------------------- Gestion du Catalogue ----------------------
        Route::get('/catalogue-structure', [ArticleController::class, 'getCatalogueStructure']);
        Route::post('/magasins', [ArticleController::class, 'storeMagasin']);
        Route::post('/articles', [ArticleController::class, 'store']);
        Route::post('/familles', [ArticleController::class, 'storeFamille']);
        Route::post('/categories', [ArticleController::class, 'storeCategorie']);
        Route::post('/articles/{id}/block', [ArticleController::class, 'toggleBlock']);

        // ---------------------- Gestion des Commandes Fournisseurs ----------------------
        Route::post('/commandes', [CommandeController::class, 'store']);
        Route::get('/commandes', [CommandeController::class, 'index']);
        Route::get('/commandes/en-attente', [CommandeController::class, 'getCommandesEnAttente']);
        Route::post('/commandes/{id}/traiter', [CommandeController::class, 'traiterCommande']);

        // ---------------------- Commandes Automatiques ----------------------
        Route::post('/commandes-auto/generer', [CommandeAutoController::class, 'generer']);
        Route::post('/commandes-auto/configurer', [CommandeAutoController::class, 'configurer']);



        // ---------------------- Gestion des Stocks ----------------------
        Route::prefix('stocks')->group(function () {
            Route::get('/', [StockController::class, 'index']);
            Route::get('/alertes', [StockController::class, 'alertes']);
            Route::put('/{id}', [StockController::class, 'update']);
            Route::post('/entree', [StockController::class, 'entree']);
            Route::post('/sortie', [StockController::class, 'sortie']);
            Route::post('/transfert', [StockController::class, 'transfert']);
        });

        // ---------------------- Mouvements Récents ----------------------
        Route::get('/mouvements/recent', [StockController::class, 'recentMouvements']);

        // ---------------------- Rapports ----------------------
        Route::prefix('rapports')->group(function () {
            Route::get('/mission', [RapportController::class, 'mission']);
            Route::get('/mouvements-journaliers', [RapportController::class, 'mouvementsJournaliers']);
            Route::get('/approvisionnements', [RapportController::class, 'approvisionnements']);
            Route::get('/sorties', [RapportController::class, 'sorties']);
            Route::get('/fiche-stock/{article_id}', [RapportController::class, 'ficheStock']);
            Route::get('/alertes', [RapportController::class, 'alertesPdf']);
        });

        // ---------------------- Export / Import ----------------------
        Route::prefix('export')->group(function () {
            Route::get('/articles', [ExportController::class, 'exportArticles']);
            Route::get('/stocks-csv', [ExportController::class, 'exportStocksCsv']);
            Route::get('/alertes-pdf', [RapportController::class, 'alertesPdf']);
        });

        // ---------------------- Scan Code-Barres ----------------------
        Route::prefix('scan')->group(function () {
            Route::post('/', [ScanController::class, 'scanner']);
            Route::post('/entree-rapide', [ScanController::class, 'entreeRapide']);
            Route::post('/sortie-rapide', [ScanController::class, 'sortieRapide']);
            Route::post('/transfert-rapide', [ScanController::class, 'transfertRapide']);
        });

        // ---------------------- Retours Magasin ----------------------
        Route::prefix('retours')->group(function () {
            Route::get('/', [RetourController::class, 'index']);
            Route::post('/', [RetourController::class, 'store']);
            Route::post('/{id}/approuver', [RetourController::class, 'approuver']);
            Route::post('/{id}/refuser', [RetourController::class, 'refuser']);
        });

        // ---------------------- Transferts ----------------------
        Route::get('/transferts', [TransfertController::class, 'index']);
        Route::post('/transferts', [TransfertController::class, 'store']);
        Route::get('/transferts/{id}', [TransfertController::class, 'show']);

        // ---------------------- Inventaires ----------------------
        Route::prefix('inventaires')->group(function () {
            Route::get('/', [InventaireController::class, 'index']);
            Route::post('/', [InventaireController::class, 'store']);
            Route::get('/{id}', [InventaireController::class, 'show']);
            Route::post('/{id}/start', [InventaireController::class, 'start']);
            Route::post('/{id}/finalize', [InventaireController::class, 'finalize']);
        });

        Route::get('/alertes', [AlertesController::class, 'index']);
        Route::get('/alertes/stats', [AlertesController::class, 'stats']);
        // ---------------------- Paramètres ----------------------
        Route::get('/settings/general', [SettingsController::class, 'general']);
        Route::get('/settings/stock', [SettingsController::class, 'stock']);
        Route::get('/settings/notifications', [SettingsController::class, 'notifications']);
        Route::get('/settings/backup', [SettingsController::class, 'backup']);
        Route::post('/settings/{group}', [SettingsController::class, 'update']);
        Route::post('/settings/{group}/reset', [SettingsController::class, 'reset']);
    });

    // ===================================================================
    // ==================== ROUTES MAGASINIER =============================
    // ===================================================================

    Route::prefix('magasinier')->group(function () {

        // ---------------------- Demandes ----------------------
        Route::get('/demandes', [MagasinierDemandeController::class, 'index']);
        Route::post('/demandes/{id}/approuver', [MagasinierDemandeController::class, 'approuver']);
        Route::post('/demandes/{id}/refuser', [MagasinierDemandeController::class, 'refuser']);
        Route::post('/demandes/{id}/livrer', [MagasinierDemandeController::class, 'livrer']);

        // ---------------------- Réservations ----------------------
        Route::get('/reservations', [MagasinierReservationController::class, 'index']);
        Route::post('/reservations/{id}/confirmer', [MagasinierReservationController::class, 'confirmer']);
        Route::post('/reservations/{id}/annuler', [MagasinierReservationController::class, 'annuler']);
        Route::get('/reservations/{id}', [MagasinierReservationController::class, 'show']);

        // ---------------------- Retours ----------------------
        Route::prefix('retours')->group(function () {
            Route::get('/', [MagasinierRetourController::class, 'index']);
            Route::post('/{id}/approuver', [MagasinierRetourController::class, 'approuver']);
            Route::post('/{id}/refuser', [MagasinierRetourController::class, 'refuser']);
            Route::get('/{id}', [MagasinierRetourController::class, 'show']);
        });

        // ---------------------- Magasins & Stocks ----------------------
        Route::get('/magasins', [MagasinController::class, 'index']);
        Route::get('/stocks', [MagasinierStockController::class, 'index']);

        // ---------------------- Scan Code-Barres ----------------------
        Route::prefix('scan')->group(function () {
            Route::post('/', [MagasinierScanController::class, 'scanner']);
            Route::post('/entree-rapide', [MagasinierScanController::class, 'entreeRapide']);
            Route::post('/sortie-rapide', [MagasinierScanController::class, 'sortieRapide']);
        });

        // ---------------------- Mouvements de Stock ----------------------
        Route::prefix('mouvements')->group(function () {
            Route::get('/', [MagasinierMouvementController::class, 'index']);
            Route::get('/stats', [MagasinierMouvementController::class, 'stats']);
            Route::post('/entree', [MagasinierMouvementController::class, 'entree']);
            Route::post('/sortie', [MagasinierMouvementController::class, 'sortie']);
            Route::post('/ajustement', [MagasinierMouvementController::class, 'ajustement']);
        });

        // ---------------------- Inventaire ----------------------
        Route::get('/inventaire/actuel', [MagasinierInventaireController::class, 'actuel']);
        Route::post('/inventaire/{id}/save', [MagasinierInventaireController::class, 'save']);
        Route::post('/inventaire/{id}/finaliser', [MagasinierInventaireController::class, 'finaliser']);

        // ---------------------- Alertes ----------------------
        Route::get('/alertes', [AlerteController::class, 'index']);
        Route::get('/alertes/stats', [AlerteController::class, 'stats']);

        // ---------------------- Bons de Réception ----------------------
        Route::get('/bons-reception', [BonReceptionController::class, 'index']);
        Route::get('/bons-reception/{id}', [BonReceptionController::class, 'show']);
        Route::get('/bons-reception/{id}/pdf', [BonReceptionController::class, 'exportPDF']);
        Route::get('/bons-reception/stats', [BonReceptionController::class, 'stats']);
    });

    // ===================================================================
    // ==================== ROUTES DEMANDEUR (USER) =======================
    // ===================================================================

    Route::prefix('user')->group(function () {

        // ---------------------- Demandes ----------------------
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

        // ---------------------- Retours ----------------------
        Route::prefix('retours')->group(function () {
            Route::get('/', [UserRetourController::class, 'index']);
            Route::post('/', [UserRetourController::class, 'store']);
            Route::get('/{id}', [UserRetourController::class, 'show']);
        });

        // ---------------------- Consultation Stock ----------------------
        Route::prefix('stock')->group(function () {
            Route::get('/articles', [UserStockController::class, 'index']);
            Route::get('/articles/{id}', [UserStockController::class, 'show']);
            Route::get('/familles', [UserStockController::class, 'familles']);
            Route::get('/categories', [UserStockController::class, 'categories']);
            Route::get('/stats', [UserStockController::class, 'stats']);
        });

        // ---------------------- Réservations ----------------------
        Route::prefix('reservations')->group(function () {
            Route::get('/', [UserReservationController::class, 'index']);
            Route::post('/', [UserReservationController::class, 'store']);
            Route::delete('/{id}', [UserReservationController::class, 'destroy']);
        });
    });
});