<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BonReception extends Model
{
    use HasFactory;

    protected $table = 'bons_receptions';

    protected $fillable = [
        'commande_id',
        'numero_bon',
        'date_reception',
    ];

    // 🔥 CORRECTION : La clé étrangère est 'commande_id'
    public function commandeFournisseur()
    {
        return $this->belongsTo(CommandeFournisseur::class, 'commande_id');
    }

    public function lignes()
    {
        return $this->hasMany(LigneBonReception::class, 'bon_reception_id');
    }
}