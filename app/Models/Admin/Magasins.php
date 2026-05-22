<?php
namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use App\Models\Admin\Article;

class Magasins extends Model
{
    // تحديد الحقول لي مسموح التعديل عليها (Mass Assignment)
    protected $fillable = [
        'nom_magasin',
        'localisation'
    ];

    /**
     * علاقة: مخزن واحد يقدر يكون فيه بزاف ديال السلع (Stocks)
     */
    public function stocks()
    {
        return $this->hasMany(Stock::class);
    }

    public function articles() {
        return $this->belongsToMany(Article::class, 'article_magasin');
    }

    /**
     * علاقة: مخزن واحد يقدر يكون طرف فبزاف ديال حركات المخزون
     */
    // public function mouvementsOrigine()
    // {
    //     return $this->hasMany(MouvementStock::class, 'magasin_origine_id');
    // }

    // public function mouvementsDestination()
    // {
    //     return $this->hasMany(MouvementStock::class, 'magasin_destination_id');
    // }
}