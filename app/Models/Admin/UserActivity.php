<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;

class UserActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'action_type',
        'ip_address',
        'user_agent',
        'details',
    ];

    // ========== Relations ==========

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ========== Scopes ==========

    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('action_type', $type);
    }

    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // ========== Accessors ==========

    public function getActionLabelAttribute(): string
    {
        return match($this->action) {
            'user_login'       => 'Connexion',
            'user_logout'      => 'Déconnexion',
            'user_created'     => 'Compte créé',
            'user_updated'     => 'Compte modifié',
            'user_deleted'     => 'Compte supprimé',
            'user_blocked'     => 'Compte bloqué',
            'user_unblocked'   => 'Compte débloqué',
            'user_locked'      => 'Compte verrouillé',
            'user_activated'   => 'Compte activé',
            'user_deactivated' => 'Compte désactivé',
            'password_changed' => 'Mot de passe modifié',
            'password_reset'   => 'Mot de passe réinitialisé',
            default            => $this->action,
        };
    }
}