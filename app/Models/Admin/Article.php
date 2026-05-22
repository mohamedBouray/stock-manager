<?php
namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Admin\Demande;
use App\Models\Admin\Reservation;
use App\Models\Admin\Categories;

class Article extends Model
{
    protected $table = 'articles';
    
    protected $fillable = [
        'code_barre', 'designation', 'description', 
        'unite_mesure', 'image_url', 'quantite_stock',
        'seuil_alerte', 'seuil_critique', 'prix_unitaire',
        'emplacement', 'statut', 'categorie_id'
    ];
    
    protected $casts = [
        'quantite_stock' => 'integer',
        'seuil_alerte' => 'integer',
        'seuil_critique' => 'integer',
        'prix_unitaire' => 'decimal:2',
    ];
    
    // Relation avec Catégorie
    public function categorie()
    {
        return $this->belongsTo(Categories::class, 'categorie_id');
    }
    
    // Relation avec Demandes
    public function demandes()
    {
        return $this->hasMany(Demande::class);
    }
    
    // Relation avec Réservations
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }
    
    // Vérifier si l'article est disponible
    public function estDisponible($quantite)
    {
        return $this->quantite_stock >= $quantite;
    }
    
    // Vérifier si stock bas
    public function estEnStockBas()
    {
        return $this->quantite_stock <= $this->seuil_alerte;
    }
    
    // Vérifier si stock critique
    public function estEnStockCritique()
    {
        return $this->quantite_stock <= $this->seuil_critique;
    }
}