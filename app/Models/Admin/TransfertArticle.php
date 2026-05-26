<?php
namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class TransfertArticle extends Model
{
    protected $table = 'transferts_articles';
    
    protected $fillable = [
        'article_source_id',
        'article_dest_id',
        'magasin_id',
        'quantite',
        'motif',
        'user_id'
    ];
    
    public function articleSource()
    {
        return $this->belongsTo(Article::class, 'article_source_id');
    }
    
    public function articleDest()
    {
        return $this->belongsTo(Article::class, 'article_dest_id');
    }
    
    public function magasin()
    {
        return $this->belongsTo(Magasins::class, 'magasin_id');
    }
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}