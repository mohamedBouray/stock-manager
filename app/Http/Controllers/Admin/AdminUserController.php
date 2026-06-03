<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Admin\UserActivity;
use App\Models\Admin\Magasins;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Helpers\NotificationHelper;
use App\Models\Admin\Article;           
use App\Models\Admin\CommandeFournisseur; 
use App\Models\Admin\Mouvement; 
use Illuminate\Support\Facades\Cache;

class AdminUserController extends Controller
{
    private function checkAdmin()
    {
        $user = auth()->user();
        if (!$user || $user->role !== 'admin') {
            abort(403, 'Accès non autorisé - Vous devez être administrateur');
        }
        return true;
    }

    public function index(Request $request)
    {
        try {
            $this->checkAdmin();
            
            $query = User::query();
            
            if ($request->search) {
                $query->where(function($q) use ($request) {
                    $q->where('name', 'like', "%{$request->search}%")
                      ->orWhere('email', 'like', "%{$request->search}%");
                });
            }
            
            if ($request->role) {
                $query->where('role', $request->role);
            }
            
            if ($request->status === 'blocked') {
                $query->where('is_blocked', true);
            } elseif ($request->status === 'active') {
                $query->where('is_blocked', false);
            }
            
            $users = $query->orderBy('created_at', 'desc')->paginate(20);
            
            return response()->json($users);
        } catch (\Exception $e) {
            Log::error('Error in index: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    public function show($id)
    {
        try {
            $this->checkAdmin();
            $user = User::with('activities')->findOrFail($id);
            return response()->json($user);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }
    }
    
    // Créer un utilisateur
    public function store(Request $request)
    {
        try {
            $this->checkAdmin();
            
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users',
                'password' => 'required|min:8',
                'role' => 'required|in:admin,magasinier,user',
            ]);
            
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
            ]);
            
            $user->recordActivity('user_created', "Créé par " . auth()->user()->name);
            
            return response()->json($user, 201);
        } catch (\Exception $e) {
            Log::error('Error in store: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    // Modifier un utilisateur
    public function update(Request $request, $id)
    {
        try {
            $this->checkAdmin();
            
            $user = User::findOrFail($id);
            
            $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $id,
                'role' => 'sometimes|in:admin,magasinier,user',
                'is_blocked' => 'sometimes|boolean',
                'magasin_id' => 'sometimes|nullable|exists:magasins,id' 
            ]);
            
            // 🔥 CORRECTION: Fusionner les deux en une seule ligne
            $updateData = $request->only(['name', 'email', 'role', 'is_blocked', 'magasin_id']);
            $user->update($updateData);
            
            if ($request->has('is_blocked')) {
                $action = $request->is_blocked ? 'blocked' : 'unblocked';
                $user->recordActivity("user_{$action}", "Par " . auth()->user()->name);
            }
            
            return response()->json($user);
            
        } catch (\Exception $e) {
            Log::error('Error in update: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    // Bloquer un utilisateur
    public function block($id)
{
    try {
        $this->checkAdmin();
        
        $user = User::findOrFail($id);
        
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'Vous ne pouvez pas bloquer votre propre compte'
            ], 422);
        }
        
        $user->block();
        $user->recordActivity('user_blocked', "Bloqué par " . auth()->user()->name);
        
        $user->tokens()->delete();
        NotificationHelper::send(
            $user->id,
            'compte_bloque',
            'Compte bloqué',
            "Votre compte a été bloqué par l'administrateur. Contactez le support.",
            ['user_id' => $user->id]
        );
        return response()->json([
            'message' => 'Utilisateur bloqué avec succès',
            'user' => $user
        ]);
    } catch (\Exception $e) {
        return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
    }
}
    // Débloquer un utilisateur
    public function unblock($id)
    {
        try {
            $this->checkAdmin();
            
            $user = User::findOrFail($id);
            $user->unblock();
            $user->recordActivity('user_unblocked', "Débloqué par " . auth()->user()->name);
            NotificationHelper::send(
                $user->id,
                'compte_debloque',
                'Compte débloqué',
                "Votre compte a été débloqué par l'administrateur. Vous pouvez vous reconnecter.",
                ['user_id' => $user->id]
            );
            return response()->json(['message' => 'Utilisateur débloqué']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    // Supprimer un utilisateur
    public function destroy($id)
    {
        try {
            $this->checkAdmin();
            
            $user = User::findOrFail($id);

            if ($user->id === auth()->id()) {
                return response()->json(['message' => 'Vous ne pouvez pas vous supprimer vous-même'], 422);
            }

            DB::transaction(function () use ($user) {
                $user->recordActivity('user_deleted', "Supprimé par " . auth()->user()->name);
                $user->delete();
            });

            return response()->json(['message' => 'Utilisateur supprimé']);
        } catch (\Exception $e) {
            Log::error('Error in destroy: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
        
    // Réinitialiser mot de passe
   public function resetPassword(Request $request, $id)
    {
        try {
            $this->checkAdmin();
            
            $request->validate([
                'password' => 'required|min:8|confirmed'
            ]);
            
            $user = User::findOrFail($id);
            
            // Vérifier si l'utilisateur existe
            if (!$user) {
                return response()->json(['message' => 'Utilisateur non trouvé'], 404);
            }
            
            // Changer le mot de passe
            $user->password = Hash::make($request->password);
            $user->save();
            
            // Enregistrer l'activité
            $user->recordActivity('password_reset', "Réinitialisé par " . auth()->user()->name);
            
            return response()->json([
                'success' => true,
                'message' => 'Mot de passe réinitialisé avec succès'
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error in resetPassword: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // Activités d'un utilisateur
    public function activities($id)
    {
        try {
            $this->checkAdmin();
            
            $activities = UserActivity::where('user_id', $id)
                ->orderBy('created_at', 'desc')
                ->paginate(30);
            
            return response()->json($activities);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    // Statistiques système
public function updateMagasin(Request $request, $id)
{
    try {
        $this->checkAdmin();
        
        $request->validate([
            'magasin_id' => 'nullable|exists:magasins,id'
        ]);
        
        $user = User::findOrFail($id);
        
        // Vérifier que l'utilisateur est un magasinier
        if ($user->role !== 'magasinier') {
            return response()->json([
                'message' => 'Seul un magasinier peut être assigné à un magasin'
            ], 422);
        }
        
        $user->update([
            'magasin_id' => $request->magasin_id
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Magasin assigné avec succès',
            'user' => $user->fresh('magasin')
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur: ' . $e->getMessage()
        ], 500);
    }
}

/**
 * Récupérer les magasiniers avec leurs magasins
 */
public function getMagasiniersWithMagasin()
{
    try {
        $this->checkAdmin();
        
        $magasiniers = User::with('magasin')
            ->where('role', 'magasinier')
            ->get();
        
        $magasins = Magasins::all();
        
        return response()->json([
            'magasiniers' => $magasiniers,
            'magasins' => $magasins
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur: ' . $e->getMessage()
        ], 500);
    }
}
public function systemStats()
{
    try {
        $this->checkAdmin();
        
        // ✅ Cache des résultats pour 5 minutes
        $stats = Cache::remember('dashboard_system_stats', 300, function () {
            return [
                'total_articles' => Article::count(),
                'total_commandes' => CommandeFournisseur::count(),
                'stocks_alertes' => Article::whereRaw('quantite_stock <= seuil_alerte')->count(),
                'mouvements_semaine' => Mouvement::where('created_at', '>=', now()->subDays(7))->sum('quantite'),
                'commandes_en_attente' => CommandeFournisseur::where('statut', 'envoyee')->count(),
                'active_users' => User::where('is_blocked', false)->where('status', true)->count(),
                'demandes_mois' => DB::table('demandes')
                    ->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
                'valeur_stock_total' => DB::table('stocks')
                    ->join('articles', 'stocks.article_id', '=', 'articles.id')
                    ->select(DB::raw('SUM(stocks.quantite_disponible * COALESCE(articles.prix_unitaire, 0)) as total'))
                    ->value('total') ?? 0,
                'recent_activities' => UserActivity::with('user')
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get()
                    ->map(function($activity) {
                        return [
                            'id' => $activity->id,
                            'action' => $activity->action,
                            'details' => $activity->details ?: $this->getActionLabel($activity->action),
                            'user_name' => $activity->user?->name,
                            'created_at' => $activity->created_at,
                        ];
                    }),
            ];
        });
        
        return response()->json($stats);    
    } catch (\Exception $e) {
        Log::error('Error in systemStats: ' . $e->getMessage());
        return response()->json([
            'total_articles' => 0,
            'total_commandes' => 0,
            'stocks_alertes' => 0,
            'mouvements_semaine' => 0,
            'commandes_en_attente' => 0,
            'active_users' => 0,
            'demandes_mois' => 0,
            'valeur_stock_total' => 0,
            'stock_par_categorie' => [],
            'recent_activities' => []
        ], 200);
    }
}

/**
 * Récupérer les tendances des mouvements pour les graphiques
 */
public function mouvementTrends(Request $request)
{
    try {
        $this->checkAdmin();
        
        $period = $request->get('period', 'week');
        
        if ($period === 'year') {
            $data = Mouvement::select(
                    DB::raw('MONTH(created_at) as month'),
                    DB::raw('SUM(CASE WHEN type = "entree" THEN quantite ELSE 0 END) as entries'),
                    DB::raw('SUM(CASE WHEN type = "sortie" THEN quantite ELSE 0 END) as exits')
                )
                ->whereYear('created_at', now()->year)
                ->groupBy('month')
                ->orderBy('month')
                ->get();
                
            $entries = array_fill(0, 12, 0);
            $exits = array_fill(0, 12, 0);
            
            foreach ($data as $d) {
                $entries[$d->month - 1] = (int) $d->entries;
                $exits[$d->month - 1] = (int) $d->exits;
            }
            
            return response()->json(['entries' => $entries, 'exits' => $exits]);
        }
        
        $days = $period === 'week' ? 7 : 30;
        $startDate = now()->subDays($days);
        
        $data = Mouvement::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(CASE WHEN type = "entree" THEN quantite ELSE 0 END) as entries'),
                DB::raw('SUM(CASE WHEN type = "sortie" THEN quantite ELSE 0 END) as exits')
            )
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');
        
        $entries = [];
        $exits = [];
        $labels = [];
        
        for ($i = 0; $i < $days; $i++) {
            $date = now()->subDays($days - 1 - $i);
            $dateKey = $date->format('Y-m-d');
            $labels[] = $date->format('d/m');
            $entries[] = (int) ($data[$dateKey]->entries ?? 0);
            $exits[] = (int) ($data[$dateKey]->exits ?? 0);
        }
        
        return response()->json([
            'labels' => $labels,
            'entries' => $entries, 
            'exits' => $exits
        ]);
        
    } catch (\Exception $e) {
        Log::error('Error in mouvementTrends: ' . $e->getMessage());
        return response()->json(['entries' => [], 'exits' => []], 200);
    }
}

/**
 * Récupérer les mouvements récents
 */
public function recentMouvements()
{
    try {
        $this->checkAdmin();
        
        $mouvements = Mouvement::with(['article', 'user', 'magasin'])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function($mvt) {
                return [
                    'id' => $mvt->id,
                    'type' => $mvt->type,
                    'quantite' => $mvt->quantite,
                    'article' => $mvt->article?->designation,
                    'user_name' => $mvt->user?->name,
                    'magasin_name' => $mvt->magasin?->nom_magasin,
                    'created_at' => $mvt->created_at,
                ];
            });
        
        return response()->json($mouvements);
        
    } catch (\Exception $e) {
        Log::error('Error in recentMouvements: ' . $e->getMessage());
        return response()->json([], 200);
    }
}

/**
 * Export des utilisateurs en CSV/Excel
 */
public function export(Request $request)
{
    try {
        $this->checkAdmin();
        
        $users = User::all();
        
        $filename = 'utilisateurs_' . date('Y-m-d_His') . '.csv';
        $handle = fopen('php://temp', 'w');
        
        // En-têtes CSV
        fputcsv($handle, ['ID', 'Nom', 'Email', 'Rôle', 'Magasin ID', 'Bloqué', 'Créé le', 'Dernière connexion']);
        
        foreach ($users as $user) {
            fputcsv($handle, [
                $user->id,
                $user->name,
                $user->email,
                $user->role,
                $user->magasin_id ?? '',
                $user->is_blocked ? 'Oui' : 'Non',
                $user->created_at,
                $user->last_login_at ?? '',
            ]);
        }
        
        rewind($handle);
        $csvContent = stream_get_contents($handle);
        fclose($handle);
        
        return response($csvContent, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
            
    } catch (\Exception $e) {
        Log::error('Error in export: ' . $e->getMessage());
        return response()->json(['message' => 'Erreur lors de l\'export'], 500);
    }
}

/**
 * Obtenir le libellé d'une action
 */
private function getActionLabel($action)
{
    $labels = [
        'user_login' => 'Connexion utilisateur',
        'user_logout' => 'Déconnexion',
        'user_created' => 'Nouveau compte créé',
        'user_updated' => 'Compte modifié',
        'user_blocked' => 'Compte bloqué',
        'user_unblocked' => 'Compte débloqué',
        'user_deleted' => 'Compte supprimé',
        'password_changed' => 'Mot de passe modifié',
        'password_reset' => 'Mot de passe réinitialisé',
        'demande_created' => 'Nouvelle demande',
        'demande_approuvee' => 'Demande approuvée',
        'demande_refusee' => 'Demande refusée',
        'demande_livree' => 'Demande livrée',
        'stock_entree' => 'Entrée de stock',
        'stock_sortie' => 'Sortie de stock',
        'stock_ajustement' => 'Ajustement de stock',
    ];
    
    return $labels[$action] ?? $action;
}

}