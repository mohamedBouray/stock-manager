<?php
// app/Models/Admin/InventaireLigne.php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;

class InventaireLigne extends Model
{
    protected $table = 'inventaire_lignes';
    
    protected $fillable = [
        'inventaire_id',
        'article_id',
        'quantite_theorique',
        'quantite_reelle',
        'ecart',
        'observations',
        'est_corrige'
    ];
    
    public function inventaire()
    {
        return $this->belongsTo(Inventaire::class);
    }
    
    public function article()
    {
        return $this->belongsTo(Article::class);
    }
}