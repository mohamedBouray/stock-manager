<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $fillable = ['demande_id', 'user_id', 'magasinier_id'];
    
    public function demande() { return $this->belongsTo(Admin\Demande::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function magasinier() { return $this->belongsTo(User::class, 'magasinier_id'); }
    public function messages() { return $this->hasMany(Message::class); }
}