<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommandeFournisseur extends Model
{
    protected $table = 'commandes_fournisseurs';

    protected $fillable = [
        'numero_commande', 'fournisseur', 'date_commande', 'statut', 'magasin_id'
    ];
    
    public function lignes(): HasMany
    {
        return $this->hasMany(LigneCommande::class, 'commande_id');
    }

    public function bonsReceptions(): HasMany
    {
        return $this->hasMany(BonReception::class, 'commande_id');
    }
}