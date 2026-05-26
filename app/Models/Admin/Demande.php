<?php
namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Demande extends Model
{
    protected $table = 'demandes';
    
    protected $fillable = [
        'user_id', 'article_id', 'quantite_demandee', 'quantite_accorde',
        'statut', 'motif', 'commentaire_refus', 'date_demande',
        'date_traitement', 'traite_par'
    ];
    
    protected $casts = [
        'date_demande' => 'datetime',
        'date_traitement' => 'datetime',
    ];
    
    // Relation avec l'utilisateur (demandeur)
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    // Relation avec l'article
    public function article()
    {
        return $this->belongsTo(Article::class);
    }
    
    // Relation avec l'utilisateur qui a traité
    public function traitePar()
    {
        return $this->belongsTo(User::class, 'traite_par');
    }
    
    // Statuts disponibles
    public static function statuts()
    {
        return [
            'en_attente' => 'En attente',
            'approuvee' => 'Approuvée',
            'refusee' => 'Refusée',
            'livree' => 'Livrée'
        ];
    }
    
    // Vérifier si modifiable
    public function estModifiable()
    {
        return $this->statut === 'en_attente';
    }
    public function retours()
{
    return $this->hasMany(RetourMagasin::class);
}

public function getQuantiteRetourneeAttribute()
{
    return $this->retours()->where('statut', 'approuve')->sum('quantite');
}

public function getQuantiteNetAttribute()
{
    $recu = $this->quantite_accorde ?? $this->quantite_demandee;
    return $recu - $this->getQuantiteRetourneeAttribute();
}

public function getQuantiteRecuAttribute()
{
    return $this->quantite_accorde ?? $this->quantite_demandee;
}
// app/Models/Admin/Demande.php

public function getStockMagasinActuelAttribute()
{
    // Pour magasinier connecté
    if (auth()->check() && auth()->user()->magasin_id) {
        $stock = \App\Models\Admin\Stock::where('article_id', $this->article_id)
            ->where('magasin_id', auth()->user()->magasin_id)
            ->first();
        return $stock ? $stock->quantite_disponible : 0;
    }
    
    // Fallback: stock global
    return $this->article->quantite_stock ?? 0;
}
}