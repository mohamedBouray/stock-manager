<?php
namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;

class Magasins extends Model
{
    protected $table = 'magasins';
    
    protected $fillable = [
        'nom_magasin',
        'localisation'
    ];

    // 🔥 CORRECTION ICI
    public function stocks()
    {
        return $this->hasMany(Stock::class, 'magasin_id');
    }

    public function articles()
    {
        return $this->belongsToMany(Article::class, 'article_magasin', 'magasins_id', 'article_id');
    }
}