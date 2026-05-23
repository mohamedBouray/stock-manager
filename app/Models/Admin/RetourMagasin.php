<?php
namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class RetourMagasin extends Model
{
    protected $table = 'retours_magasin';
    
    protected $fillable = [
        'demande_id',
        'article_id',
        'quantite',
        'motif',
        'statut',
        'user_id'
    ];
    
    public function demande()
    {
        return $this->belongsTo(Demande::class);
    }
    
    public function article()
    {
        return $this->belongsTo(Article::class);
    }
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}