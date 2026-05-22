<?php
namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;

class Stock extends Model
{
    protected $fillable = [
        'article_id',
        'magasin_id',
        'quantite_disponible',
        'quantite_reservee',
        'emplacement_code'
    ];

    // علاقة مع المادة
    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    // علاقة مع المخزن
    public function magasin()
    {
        return $this->belongsTo(Magasins::class);
    }
}