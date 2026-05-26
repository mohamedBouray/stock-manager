<?php

namespace App\Http\Controllers\Commun;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Admin\Famille;
use App\Models\Admin\Article;
use App\Models\Admin\Magasins;
use App\Models\Admin\Categories;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log; 

class ArticleController extends Controller
{

    public function index(Request $request)
        {
            try {
                $articles = Article::with(['categorie.famille', 'magasins'])->get();
                
                return response()->json([
                    'success' => true,
                    'data' => $articles,
                    'total' => $articles->count()
                ]);
            } catch (\Exception $e) {
                Log::error('Erreur index articles: ' . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la récupération des articles'
                ], 500);
            }
        }
    /**
     * جلب بنية الكاطالوق كاملة (الدالة السابقة)
     */
    public function getCatalogueStructure(){
        try {
            $familles = Famille::with('categories.articles.magasins')->get();
            $magasins = Magasins::all(); // جلب جميع المخازن المتاحة
            
            $structure = $familles->map(function($famille) {
                return [
                    'id' => $famille->id,
                    'nom_famille' => $famille->nom_famille,
                    'categories' => $famille->categories->map(function($category) {
                        return [
                            'id' => $category->id,
                            'nom_categorie' => $category->nom_categorie,
                            'articles' => $category->articles->map(function($article) {
                                return [
                                    'id' => $article->id,
                                    'designation' => $article->designation,
                                    'unite' => $article->unite_mesure,
                                    'code_barre' => $article->code_barre,
                                    'magasins' => $article->magasins->map(function($m) {
                                        return ['id' => $m->id, 'nom_magasin' => $m->nom_magasin];
                                    })
                                ];
                            })
                        ];
                    })
                ];
            });

            // غانصيفطو الكاطالوق والمخازن بجوج ف ريسپونص واحدة
            return response()->json([
                'catalogue' => $structure,
                'magasins' => $magasins
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    /**
     * إضافة Article جديد وربطه بالمخازن
     */
    public function store(Request $request)
    {
        // حيت الـ FormData كتصيفط كولشي كـ String، غانحولوا النص ديال الـ magasins لـ Array
        if ($request->has('magasins_ids')) {
            $request->merge([
                'magasins_ids' => json_decode($request->magasins_ids, true)
            ]);
        }

        $validator = Validator::make($request->all(), [
            'categorie_id'  => 'required|exists:categories,id',
            'code_barre'    => 'required|string|unique:articles,code_barre',
            'designation'   => 'required|string|max:255',
            'description'   => 'nullable|string',
            'unite_mesure'  => 'required|string|max:50',
            'image'         => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'seuil_alerte'  => 'nullable|integer|min:0',
            'statut'        => 'nullable|in:actif,inactif',
            'magasins_ids'  => 'required|array', // إجباري تختار مخزن واحد على الأقل
            'magasins_ids.*'=> 'exists:magasins,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        try {
            $imageUrl = null;
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('articles', 'public');
                $imageUrl = asset('storage/' . $path);
            }

            // 1. إنشاء الـ Article
            $article = Article::create([
                'categorie_id' => $request->categorie_id,
                'code_barre'   => $request->code_barre,
                'designation'  => $request->designation,
                'description'  => $request->description,
                'unite_mesure' => $request->unite_mesure,
                'image_url'    => $imageUrl,
                'seuil_alerte' => $request->seuil_alerte ?? 5,
                'statut'       => $request->statut ?? 'actif',
            ]);

            // 2. ربط المادة بالمخازن المختارة فـ الجدول الوسيط
            $article->magasins()->attach($request->magasins_ids);

            return response()->json([
                'status'  => 'success',
                'message' => 'Article créé et affecté aux magasins avec succès !',
                'data'    => $article->load('magasins')
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    /**
     * إضافة مخزن جديد (Magasin)
     */
    public function storeMagasin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_magasin'  => 'required|string|max:255|unique:magasins,nom_magasin',
            'localisation' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        try {
            $magasin = Magasins::create([
                'nom_magasin'  => $request->nom_magasin,
                'localisation' => $request->localisation
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Magasin créé avec succès !',
                'data' => $magasin
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    public function storeFamille(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_famille' => 'required|string|max:255|unique:familles,nom_famille',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $famille = Famille::create([
                'nom_famille' => $request->nom_famille
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Famille créée avec succès !',
                'data' => $famille
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔥 2. إضافة صنف جديد (Catégorie) تابع لعائلة
     */
    public function storeCategorie(Request $request)
    {
        // هنا غانخلو الـ Validation يقبل الـ famille_id (ID) أو اسم العائلة 
        // حيت فـ الـ React نقدروا نخدموا بيهم بجوج. الأصح هو الـ ID:
        $validator = Validator::make($request->all(), [
            'nom_categorie' => 'required|string|max:255',
            'famille_id'    => 'required|exists:familles,id', // تأكيد أن العائلة موجودة
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // التحقق من عدم تكرار نفس الصنف فـ نفس العائلة
            $existe = Categories::where('nom_categorie', $request->nom_categorie)
                               ->where('famille_id', $request->famille_id)
                               ->exists();

            if ($existe) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cette catégorie existe déjà dans cette famille.'
                ], 422);
            }

            $categorie = Categories::create([
                'nom_categorie' => $request->nom_categorie,
                'famille_id'    => $request->famille_id
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Catégorie créée avec succès !',
                'data' => $categorie
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
}