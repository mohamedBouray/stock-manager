<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Categories extends Model
{
    use HasFactory;

    protected $table = 'categories';

    protected $fillable = ['nom_categorie', 'famille_id'];

    /**
     * Une catégorie appartient à une seule famille.
     */
    public function famille()
    {
        return $this->belongsTo(Famille::class, 'famille_id');
    }

    /**
     * Une catégorie possède plusieurs articles.
     */
    public function articles()
    {
        // On lie Categorie à Article via la clé étrangère 'categorie_id'
        return $this->hasMany(Article::class, 'categorie_id');
    }
}