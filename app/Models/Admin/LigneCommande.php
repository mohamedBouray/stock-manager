<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LigneCommande extends Model
{
    protected $table = 'lignes_commande';

    protected $fillable = [
        'commande_id', 'article_id', 'quantite_commandee', 'quantite_livree'
    ];

    // كل سطر تابع لطلبية معينة
    public function commande(): BelongsTo
    {
        return $this->belongsTo(CommandeFournisseur::class, 'commande_id');
    }

    // كل سطر مرتبط بمادة (Article) معينة
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class, 'article_id');
    }
    
    // 💡 Accessor زوين غينفعك ف الـ Front-end باش تعرف شحال باقي خاص ديال السلعة ف هاد السطر
    public function getQuantiteRestanteAttribute()
    {
        return $this->quantite_commandee - $this->quantite_livree;
    }
}