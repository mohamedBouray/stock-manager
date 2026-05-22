<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Admin\Demande;
use App\Models\Admin\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;

class DemandeController extends Controller
{

    
    // Liste des demandes de l'utilisateur connecté
    public function index(Request $request)
    {
        $query = Demande::with(['article.categorie', 'article.categorie.famille'])
            ->where('user_id', Auth::id());
        
        // Filtrer par statut
        if ($request->statut && in_array($request->statut, ['en_attente', 'approuvee', 'refusee', 'livree'])) {
            $query->where('statut', $request->statut);
        }
        
        $demandes = $query->orderBy('created_at', 'desc')->paginate(20);
        
        return response()->json([
            'success' => true,
            'data' => $demandes
        ]);
    }
    
    // Créer une nouvelle demande
    public function store(Request $request)
    {
        $request->validate([
            'article_id' => 'required|exists:articles,id',
            'quantite_demandee' => 'required|integer|min:1',
            'motif' => 'nullable|string|max:500',
        ]);
        
        $article = Article::find($request->article_id);
        
        $demande = Demande::create([
            'user_id' => Auth::id(),
            'article_id' => $request->article_id,
            'quantite_demandee' => $request->quantite_demandee,
            'motif' => $request->motif,
            'date_demande' => now(),
            'statut' => 'en_attente',
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Demande créée avec succès',
            'data' => $demande->load('article')
        ], 201);
    }
    
    // Voir une demande spécifique
    public function show($id)
    {
        $demande = Demande::with(['article', 'traitePar'])
            ->where('user_id', Auth::id())
            ->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $demande
        ]);
    }
    
    // Modifier une demande (seulement si en attente)
    public function update(Request $request, $id)
    {
        $demande = Demande::where('user_id', Auth::id())
            ->where('id', $id)
            ->where('statut', 'en_attente')
            ->firstOrFail();
        
        $request->validate([
            'quantite_demandee' => 'required|integer|min:1',
            'motif' => 'nullable|string|max:500',
        ]);
        
        $demande->update([
            'quantite_demandee' => $request->quantite_demandee,
            'motif' => $request->motif,
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Demande modifiée avec succès',
            'data' => $demande
        ]);
    }
    
    // Annuler une demande
    public function destroy($id)
    {
        $demande = Demande::where('user_id', Auth::id())
            ->where('id', $id)
            ->where('statut', 'en_attente')
            ->firstOrFail();
        
        $demande->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Demande annulée avec succès'
        ]);
    }
    public function archive($id)
    {
        $demande = Demande::where('user_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();
        
        $demande->update([
            'is_archived' => true,
            'archived_at' => now()
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Demande archivée'
        ]);
    }

    // Ajouter cette méthode
    public function getArchives()
    {
        $demandes = Demande::with(['article'])
            ->where('user_id', Auth::id())
            ->where('is_archived', true)
            ->orderBy('archived_at', 'desc')
            ->paginate(20);
        
        return response()->json([
            'success' => true,
            'data' => $demandes
        ]);
    }
    public function exportPDF($id)
    {
        $demande = Demande::with(['user', 'article'])
            ->where('user_id', Auth::id())
            ->findOrFail($id);
        
        $pdf = Pdf::loadView('pdf.demande', compact('demande'));
        
        return $pdf->download('demande_' . $demande->id . '.pdf');
    }
    public function bonLivraison($id)
    {
        try {
            $demande = Demande::with(['user', 'article'])
                ->where('user_id', Auth::id())
                ->where('statut', 'livree') // Seulement les demandes livrées
                ->findOrFail($id);
            
            $pdf = Pdf::loadView('pdf.bon-livraison', compact('demande'));
            
            return $pdf->download('bon_livraison_' . $demande->id . '.pdf');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}