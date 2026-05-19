<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Permission extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'guard_name',
        'module',
        'description',
    ];

    // ========== Relations ==========

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_permissions')->withTimestamps();
    }

    // ========== Scopes ==========

    public function scopeByModule($query, string $module)
    {
        return $query->where('module', $module);
    }
}