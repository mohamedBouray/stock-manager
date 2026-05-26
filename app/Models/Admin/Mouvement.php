<?php
namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Mouvement extends Model
{
    protected $table = 'mouvements';
    
    protected $fillable = [
        'article_id', 'magasin_id', 'type', 'quantite', 
        'quantite_avant', 'quantite_apres', 'motif', 
        'reference', 'reference_type', 'user_id'
    ];
    
    public function article()
    {
        return $this->belongsTo(Article::class);
    }
    
    public function magasin()
    {
        return $this->belongsTo(Magasins::class);
    }
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}