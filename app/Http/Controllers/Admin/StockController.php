<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Stock;
use App\Models\Admin\Article;
use App\Models\Admin\Magasins;
use App\Models\Admin\Mouvement;
use App\Models\Admin\TransfertArticle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Helpers\NotificationHelper;

class StockController extends Controller
{
    // 📊 Vue globale des stocks par magasin
    public function index(Request $request)
    {
        $query = Stock::with(['article', 'magasin']);

        if (auth()->user()->role === 'magasinier' && auth()->user()->magasin_id) {
            $query->where('magasin_id', auth()->user()->magasin_id);
        }
        
        if ($request->magasin_id) {
            $query->where('magasin_id', $request->magasin_id);
        }
        
        if ($request->article_id) {
            $query->where('article_id', $request->article_id);
        }
        
        $stocks = $query->paginate(50);
        $magasins = Magasins::all();
        $alertes = Stock::whereRaw('quantite_disponible <= articles.seuil_alerte')
            ->join('articles', 'stocks.article_id', '=', 'articles.id')
            ->select('stocks.*')
            ->get();
        
        return response()->json([
            'stocks' => $stocks,
            'magasins' => $magasins,
            'alertes' => $alertes
        ]);
    }
    
    // 🔔 Alertes stock sous seuil
    public function alertes()
    {
        $alertes = Stock::with(['article', 'magasin'])
            ->join('articles', 'stocks.article_id', '=', 'articles.id')
            ->whereColumn('stocks.quantite_disponible', '<=', 'articles.seuil_alerte')
            ->select('stocks.*')
            ->get();
            
        return response()->json($alertes);
    }
    
    // ✏️ Ajustement manuel
    public function update(Request $request, $id)
    {
        $request->validate([
            'quantite_disponible' => 'required|integer|min:0'
        ]);
        
        $stock = Stock::findOrFail($id);
        $ancienneQuantite = $stock->quantite_disponible;
        
        $stock->update([
            'quantite_disponible' => $request->quantite_disponible
        ]);
        
        Mouvement::create([
            'article_id' => $stock->article_id,
            'magasin_id' => $stock->magasin_id,
            'type' => 'ajustement',
            'quantite' => abs($request->quantite_disponible - $ancienneQuantite),
            'quantite_avant' => $ancienneQuantite,
            'quantite_apres' => $request->quantite_disponible,
            'motif' => $request->motif ?? 'Ajustement manuel',
            'reference_type' => 'ajustement',
            'user_id' => Auth::id()
        ]);
        
        return response()->json($stock);
    }
    
    // 📥 Entrée en stock
    public function entree(Request $request)
    {
        $request->validate([
            'article_id' => 'required|exists:articles,id',
            'magasin_id' => 'required|exists:magasins,id',
            'quantite' => 'required|integer|min:1',
            'motif' => 'nullable|string'
        ]);
        
        $stock = Stock::firstOrCreate(
            [
                'article_id' => $request->article_id,
                'magasin_id' => $request->magasin_id
            ],
            ['quantite_disponible' => 0, 'quantite_reservee' => 0]
        );
        
        $ancienneQuantite = $stock->quantite_disponible;
        $stock->increment('quantite_disponible', $request->quantite);
        
        Mouvement::create([
            'article_id' => $request->article_id,
            'magasin_id' => $request->magasin_id,
            'type' => 'entree',
            'quantite' => $request->quantite,
            'quantite_avant' => $ancienneQuantite,
            'quantite_apres' => $stock->quantite_disponible,
            'motif' => $request->motif,
            'reference_type' => 'manuelle',
            'user_id' => Auth::id()
        ]);
        
        return response()->json(['message' => 'Entrée enregistrée', 'stock' => $stock]);
    }
    
    // 📤 Sortie de stock
    public function sortie(Request $request)
    {
        $request->validate([
            'article_id' => 'required|exists:articles,id',
            'magasin_id' => 'required|exists:magasins,id',
            'quantite' => 'required|integer|min:1',
            'motif' => 'nullable|string'
        ]);
        
        $stock = Stock::where('article_id', $request->article_id)
            ->where('magasin_id', $request->magasin_id)
            ->firstOrFail();
            
        if ($stock->quantite_disponible < $request->quantite) {
            return response()->json(['message' => 'Stock insuffisant'], 422);
        }
        
        $ancienneQuantite = $stock->quantite_disponible;
        $stock->decrement('quantite_disponible', $request->quantite);
        
        Mouvement::create([
            'article_id' => $request->article_id,
            'magasin_id' => $request->magasin_id,
            'type' => 'sortie',
            'quantite' => $request->quantite,
            'quantite_avant' => $ancienneQuantite,
            'quantite_apres' => $stock->quantite_disponible,
            'motif' => $request->motif,
            'reference_type' => 'manuelle',
            'user_id' => Auth::id()
        ]);
        
        return response()->json(['message' => 'Sortie enregistrée', 'stock' => $stock]);
    }
    
    // 🔄 Transfert entre articles
    public function transfert(Request $request)
    {
        $request->validate([
            'article_source_id' => 'required|exists:articles,id',
            'article_dest_id' => 'required|exists:articles,id|different:article_source_id',
            'quantite' => 'required|integer|min:1',
            'magasin_id' => 'required|exists:magasins,id',
            'motif' => 'nullable|string'
        ]);
        
        $sourceStock = Stock::where('article_id', $request->article_source_id)
            ->where('magasin_id', $request->magasin_id)
            ->firstOrFail();
            
        if ($sourceStock->quantite_disponible < $request->quantite) {
            return response()->json(['message' => 'Stock source insuffisant'], 422);
        }
        
        $destStock = Stock::firstOrCreate(
            [
                'article_id' => $request->article_dest_id,
                'magasin_id' => $request->magasin_id
            ],
            ['quantite_disponible' => 0, 'quantite_reservee' => 0]
        );
        
        DB::transaction(function() use ($sourceStock, $destStock, $request) {
            $sourceStock->decrement('quantite_disponible', $request->quantite);
            $destStock->increment('quantite_disponible', $request->quantite);
            
            TransfertArticle::create([
                'article_source_id' => $request->article_source_id,
                'article_dest_id' => $request->article_dest_id,
                'quantite' => $request->quantite,
                'motif' => $request->motif,
                'user_id' => Auth::id()
            ]);
        });
        
        return response()->json(['message' => 'Transfert effectué']);
    }
    
    // 📋 Derniers mouvements récents (NOUVEAU)
    public function recentMouvements()
    {
        try {
            $mouvements = Mouvement::with(['article', 'user', 'magasin'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($mouvement) {
                    return [
                        'id' => $mouvement->id,
                        'type' => $mouvement->type,
                        'quantite' => $mouvement->quantite,
                        'article' => $mouvement->article ? [
                            'id' => $mouvement->article->id,
                            'designation' => $mouvement->article->designation,
                            'code_barre' => $mouvement->article->code_barre
                        ] : null,
                        'magasin' => $mouvement->magasin ? [
                            'id' => $mouvement->magasin->id,
                            'nom_magasin' => $mouvement->magasin->nom_magasin
                        ] : null,
                        'user' => $mouvement->user ? [
                            'name' => $mouvement->user->name
                        ] : null,
                        'motif' => $mouvement->motif,
                        'created_at' => $mouvement->created_at
                    ];
                });
            
            return response()->json($mouvements);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }
    public function checkAlertes()
{
    $alertes = Stock::with(['article', 'magasin'])
        ->whereRaw('quantite_disponible <= articles.seuil_alerte')
        ->join('articles', 'stocks.article_id', '=', 'articles.id')
        ->get();
    
    foreach ($alertes as $alerte) {
        NotificationHelper::sendToMagasiniers(
            'stock_alerte',
            ' Stock bas',
            "L'article {$alerte->article->designation} est en stock bas ({$alerte->quantite_disponible} unités)",
            ['article_id' => $alerte->article_id]
        );
        
        NotificationHelper::sendToAdmins(
            'stock_alerte',
            ' Alerte stock',
            "L'article {$alerte->article->designation} est sous le seuil d'alerte",
            ['article_id' => $alerte->article_id]
        );
    }
    
    return response()->json(['message' => 'Alertes vérifiées']);
}
    public function stats()
    {
        try {
            $queryEntrees = Mouvement::where('type', 'entree');
            $querySorties = Mouvement::where('type', 'sortie');
            $queryAjustements = Mouvement::where('type', 'ajustement');
            $queryMouvementsJour = Mouvement::whereDate('created_at', today());
            
            $stats = [
                'total_entrees' => $queryEntrees->sum('quantite'),
                'total_sorties' => $querySorties->sum('quantite'),
                'total_ajustements' => $queryAjustements->sum('quantite'),
                'mouvements_jour' => $queryMouvementsJour->count(),
            ];
            
            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json([
                'total_entrees' => 0,
                'total_sorties' => 0,
                'total_ajustements' => 0,
                'mouvements_jour' => 0
            ], 200);
        }
    }
}