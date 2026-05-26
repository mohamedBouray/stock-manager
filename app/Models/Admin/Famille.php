<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Famille extends Model
{
    use HasFactory;

    // Nom de la table associée
    protected $table = 'familles';

    // Champs autorisés pour le remplissage de masse
    protected $fillable = ['nom_famille'];

    /**
     * Une famille possède plusieurs catégories.
     */
    public function categories()
    {
        // On lie Famille à Categorie via la clé étrangère 'famille_id'
        return $this->hasMany(Categories::class, 'famille_id');
    }
}