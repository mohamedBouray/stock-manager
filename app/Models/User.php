<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Hash;
use App\Models\Admin\Magasins;
use App\Models\Admin\UserActivity;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'name', 'email', 'phone', 'password', 'role', 'profile_image',
        'is_blocked', 'status', 'theme', 'language',
        'last_login_at', 'last_login_ip', 'login_attempts', 'locked_until',
        'password_changed_at', 'force_password_change',
        'two_factor_secret', 'two_factor_recovery_codes', 'two_factor_confirmed_at',
        'bio', 'job_title','magasin_id' 
    ];

    protected $hidden = [
        'password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_blocked' => 'boolean',
        'status' => 'boolean',
        'last_login_at' => 'datetime',
        'locked_until' => 'datetime',
        'password_changed_at' => 'datetime',
        'force_password_change' => 'boolean',
        'two_factor_confirmed_at' => 'datetime',
    ];

    // ========== Relations ==========
    public function activities()
    {
        return $this->hasMany(UserActivity::class)->orderBy('created_at', 'desc');
    }

    // ========== Status Helpers ==========
    public function isBlocked()
    {
        return $this->is_blocked;
    }
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
// CCC
    public function isMagasinier(): bool
    {
        return $this->role === 'magasinier';
    }

    public function isUser(): bool
    {
        return $this->role === 'user';
    }

    // hasRole() — garder pour les permissions granulaires futures uniquement
    public function hasRole($role): bool
    {
        if (is_string($role)) {
            return $this->roles->contains('name', $role);
        }
        return (bool) $this->roles->intersect(
            is_array($role) ? collect($role) : $role
        )->count();
    }

    // isActive() — aussi corriger, locked_until doit être vérifié correctement
    public function isActive(): bool
    {
        return (bool) $this->status
            && !$this->is_blocked
            && !$this->isLocked();
    }

    // ========== Actions ==========
    public function block()
    {
        $this->update(['is_blocked' => true]);
        $this->recordActivity('user_blocked', 'Compte bloqué');
    }

    public function unblock()
    {
        $this->update(['is_blocked' => false, 'login_attempts' => 0, 'locked_until' => null]);
        $this->recordActivity('user_unblocked', 'Compte débloqué');
    }

    public function activate()
    {
        $this->update(['status' => true]);
        $this->recordActivity('user_activated', 'Compte activé');
    }

    public function deactivate()
    {
        $this->update(['status' => false]);
        $this->recordActivity('user_deactivated', 'Compte désactivé');
    }

    public function recordActivity($action, $details = null, $type = null)
    {
        return $this->activities()->create([
            'action' => $action,
            'action_type' => $type,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'details' => $details
        ]);
    }

    public function updateLastLogin()
    {
        $this->update([
            'last_login_at' => now(),
            'last_login_ip' => request()->ip(),
            'login_attempts' => 0
        ]);
        $this->recordActivity('user_login', 'Connexion réussie', 'login');
    }

    public function incrementLoginAttempts()
    {
        $this->increment('login_attempts');
        
        if ($this->login_attempts >= 5) {
            $this->update(['locked_until' => now()->addMinutes(30)]);
            $this->recordActivity('user_locked', 'Compte verrouillé après 5 tentatives', 'security');
        }
    }

    public function isLocked()
    {
        return $this->locked_until && now()->lt($this->locked_until);
    }

    public function changePassword($newPassword)
    {
        $this->update([
            'password' => Hash::make($newPassword),
            'password_changed_at' => now(),
            'force_password_change' => false
        ]);
        $this->recordActivity('password_changed', 'Mot de passe modifié', 'security');
    }

    // ========== Login Attempts ==========
    public function getRemainingLockoutTime()
    {
        if (!$this->isLocked()) {
            return 0;
        }
        return now()->diffInMinutes($this->locked_until);
    }

    // ========== Scopes ==========
    public function scopeActive($query)
    {
        return $query->where('status', true)->where('is_blocked', false);
    }

    public function scopeBlocked($query)
    {
        return $query->where('is_blocked', true);
    }

    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    // ========== Accessors ==========
    public function getAvatarUrlAttribute()
    {
        if ($this->profile_image) {
            return asset('storage/' . $this->profile_image);
        }
        return 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&background=006233&color=fff';
    }

    public function getStatusBadgeAttribute()
    {
        if ($this->is_blocked) {
            return '<span class="badge badge-danger">Bloqué</span>';
        }
        if (!$this->status) {
            return '<span class="badge badge-warning">Inactif</span>';
        }
        return '<span class="badge badge-success">Actif</span>';
    }

    public function getRoleBadgeAttribute()
    {
        $badges = [
            'admin' => '<span class="badge badge-purple">Administrateur</span>',
            'magasinier' => '<span class="badge badge-blue">Magasinier</span>',
            'user' => '<span class="badge badge-green">Demandeur</span>',
        ];
        return $badges[$this->role] ?? '<span class="badge badge-secondary">Inconnu</span>';
    }
    public function magasin()
{
    return $this->belongsTo(Magasins::class);
}

// AJOUTER CETTE MÉTHODE
public function isMagasinierOf($magasinId)
{
    return $this->role === 'admin' || $this->magasin_id == $magasinId;
}
}