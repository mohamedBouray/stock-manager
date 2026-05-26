<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * Récupérer le profil de l'utilisateur connecté
     */
    public function show(Request $request)
    {
        $user = $request->user();
        
        //  Uniformiser la réponse avec 'data'
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'language' => $user->language ?? 'fr',
                'bio' => $user->bio,
                'job_title' => $user->job_title,
                'profile_image' => $user->profile_image,
                'created_at' => $user->created_at,
                'last_login_at' => $user->last_login_at,
                'is_blocked' => $user->is_blocked,
                'email_verified_at' => $user->email_verified_at,
            ]
        ]);
    }

    /**
     * Mettre à jour le profil de l'utilisateur
     */
   public function update(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'language' => 'sometimes|string|in:fr,ar,en',
            'bio' => 'nullable|string|max:500',
            'job_title' => 'nullable|string|max:100',
            'profile_image' => 'nullable|string',
        ]);
        
        $user->update($request->only([
            'name', 'email', 'phone', 'language', 'bio', 'job_title', 'profile_image'
        ]));
        
        $user->recordActivity('profile_updated', 'Profil mis à jour', 'profile');
        
        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour avec succès',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'language' => $user->language,
                'bio' => $user->bio,
                'job_title' => $user->job_title,
                'profile_image' => $user->profile_image ? asset($user->profile_image) : null,
                'created_at' => $user->created_at,
                'last_login_at' => $user->last_login_at,
            ]
        ]);
    }

    /**
     * Uploader une photo de profil
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'profile_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);
        
        $user = $request->user();
        
        if ($request->hasFile('profile_image')) {
            // Supprimer l'ancienne image si elle existe
            if ($user->profile_image && file_exists(public_path($user->profile_image))) {
                $oldPath = str_replace('/storage/', '', $user->profile_image);
                Storage::disk('public')->delete($oldPath);
            }
            
            // Stocker la nouvelle image
            $file = $request->file('profile_image');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('avatars', $filename, 'public');
            
            $user->profile_image = '/storage/' . $path;
            $user->save();
            
            // Enregistrer l'activité
            $user->recordActivity('avatar_updated', 'Photo de profil modifiée', 'profile');
            
            return response()->json([
                'success' => true,
                'message' => 'Photo de profil mise à jour',
                'url' => $user->profile_image
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Aucun fichier uploadé'
        ], 400);
    }

    /**
     * Changer le mot de passe
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|min:8|confirmed'
        ]);
        
        $user = $request->user();
        
        // Vérifier le mot de passe actuel
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Mot de passe actuel incorrect'
            ], 422);
        }
        $user->password = Hash::make($request->password);
        $user->password_changed_at = now();
        $user->save();

        $user->recordActivity('password_changed', 'Mot de passe modifié', 'security');
        
        return response()->json([
            'success' => true,
            'message' => 'Mot de passe modifié avec succès'
        ]);
    }

    /**
     * Supprimer la photo de profil
     */
    public function deleteAvatar(Request $request)
    {
        $user = $request->user();
        
        if ($user->profile_image) {
            $oldPath = str_replace('/storage/', '', $user->profile_image);
            Storage::disk('public')->delete($oldPath);
            
            $user->profile_image = null;
            $user->save();
            
            // Enregistrer l'activité
            $user->recordActivity('avatar_deleted', 'Photo de profil supprimée', 'profile');
            
            return response()->json([
                'success' => true,
                'message' => 'Photo de profil supprimée'
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Aucune photo de profil trouvée'
        ], 404);
    }

    /**
     * Obtenir les statistiques de l'utilisateur
     */
    public function stats(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'member_since' => $user->created_at,
            'last_login' => $user->last_login_at,
            'total_logins' => $user->activities()->where('action', 'user_login')->count(),
            'last_activities' => $user->activities()->limit(5)->get(),
        ]);
    }
}