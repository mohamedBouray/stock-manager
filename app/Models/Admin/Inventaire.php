<?php


namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Inventaire extends Model
{
    protected $table = 'inventaires';
    
    protected $fillable = [
        'numero_inventaire',
        'magasin_id',
        'date_debut',
        'date_fin',
        'statut',
        'responsable_id',
        'commentaire'
    ];
    
    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date'
    ];
    
    public function magasin()
    {
        return $this->belongsTo(Magasins::class);
    }
    
    public function responsable()
    {
        return $this->belongsTo(User::class, 'responsable_id');
    }
    
    public function lignes()
    {
        return $this->hasMany(InventaireLigne::class);
    }
}