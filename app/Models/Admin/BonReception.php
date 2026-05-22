<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BonReception extends Model
{
    use HasFactory;

    // تحديد إسم الجدول كيفما مستعمل فـ الداتابيز
    protected $table = 'bons_receptions';

    protected $fillable = [
        'commande_id', // Foreign key للـ commande_fournisseur
        'numero_bon',
        'date_reception',
    ];

    /**
     * العلاقة مع الطلبية الرئيسية
     */
    public function commandeFournisseur()
    {
        return $this->belongsTo(CommandeFournisseur::class, 'commande_id');
    }

    /**
     * العلاقة مع سطور الوصل (Lignes)
     */
    public function lignes()
    {
        return $this->hasMany(LigneBonReception::class, 'bon_reception_id');
    }
}