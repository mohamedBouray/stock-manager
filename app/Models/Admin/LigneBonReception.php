<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LigneBonReception extends Model
{
    use HasFactory;

    // تحديد اسم الجدول
    protected $table = 'lignes_bon_reception';

    protected $fillable = [
        'bon_reception_id',
        'article_id',
        'quantite_recue',
    ];

    /**
     * العلاقة العكسية مع وصل الاستلام
     */
    public function bonReception()
    {
        return $this->belongsTo(BonReception::class, 'bon_reception_id');
    }

    /**
     * العلاقة مع المادة (Article) باش تجيب الـ designation و code_barre
     */
    public function article()
    {
        return $this->belongsTo(Article::class, 'article_id');
    }
}