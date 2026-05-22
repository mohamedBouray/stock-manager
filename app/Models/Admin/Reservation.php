<?php
namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Reservation extends Model
{
    protected $table = 'reservations';
    
    protected $fillable = [
        'user_id', 'article_id', 'quantite', 'date_debut',
        'date_fin', 'statut', 'motif'
    ];
    
    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];
    
    // Relation avec l'utilisateur
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    // Relation avec l'article
    public function article()
    {
        return $this->belongsTo(Article::class);
    }
    
    // Statuts disponibles
    public static function statuts()
    {
        return [
            'en_attente' => 'En attente',
            'confirmee' => 'Confirmée',
            'annulee' => 'Annulée',
            'expiree' => 'Expirée'
        ];
    }
    
    // Vérifier si la réservation est active
    public function estActive()
    {
        return in_array($this->statut, ['en_attente', 'confirmee']);
    }
    
    // Vérifier si expirée
    public function estExpiree()
    {
        return $this->date_fin < now();
    }
}