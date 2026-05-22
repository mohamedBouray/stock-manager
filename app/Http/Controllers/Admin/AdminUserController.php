<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Admin\UserActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
            ]);
            
            $user->update($request->only(['name', 'email', 'role', 'is_blocked']));
            
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
    public function systemStats()
    {
        try {
            $this->checkAdmin();
            
            $totalUsers = User::count();
            $activeUsers = User::where('is_blocked', false)->count();
            $blockedUsers = User::where('is_blocked', true)->count();
            
            $activePercentage = $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100) : 0;
            $blockedPercentage = $totalUsers > 0 ? round(($blockedUsers / $totalUsers) * 100) : 0;
            
            $newUsersThisMonth = User::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();
            
            $stats = [
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'blocked_users' => $blockedUsers,
                'active_percentage' => $activePercentage,       
                'blocked_percentage' => $blockedPercentage,      
                'new_users_this_month' => $newUsersThisMonth,   
                'admins' => User::where('role', 'admin')->count(),
                'magasiniers' => User::where('role', 'magasinier')->count(),
                'demandeurs' => User::where('role', 'user')->count(),
                'users_last_week' => User::where('created_at', '>=', now()->subDays(7))->count(),
                'recent_activities' => UserActivity::with('user')
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get()
                    ->map(function($activity) {
                        return [
                            'id' => $activity->id,
                            'user' => $activity->user ? ['name' => $activity->user->name] : null,
                            'action' => $activity->action,
                            'details' => $activity->details,
                            'created_at' => $activity->created_at
                        ];
                    }),
            ];
            
            return response()->json($stats);
        } catch (\Exception $e) {
            Log::error('Error in systemStats: ' . $e->getMessage());
            return response()->json([
                'total_users' => 0,
                'active_users' => 0,
                'blocked_users' => 0,
                'active_percentage' => 0,
                'blocked_percentage' => 0,
                'new_users_this_month' => 0,
                'admins' => 0,
                'magasiniers' => 0,
                'demandeurs' => 0,
                'users_last_week' => 0,
                'recent_activities' => []
            ], 200);
        }
    }
}