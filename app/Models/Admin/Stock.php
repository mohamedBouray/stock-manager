<?php
namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;

class Stock extends Model
{
    protected $table = 'stocks';
    
    protected $fillable = [
        'article_id',
        'magasin_id',        // ← SINGULIER
        'quantite_disponible',
        'quantite_reservee',
        'emplacement_code'
    ];

    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    // 🔥 CORRECTION ICI - CHANGER 'magasins_id' → 'magasin_id'
    public function magasin()
    {
        return $this->belongsTo(Magasins::class, 'magasin_id');
    }
}