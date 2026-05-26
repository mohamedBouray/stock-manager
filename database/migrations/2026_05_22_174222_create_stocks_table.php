<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('articles')->onDelete('cascade');
            $table->foreignId('magasin_id')->constrained('magasins')->onDelete('cascade');
            $table->integer('quantite_disponible')->default(0);
            $table->integer('quantite_reservee')->default(0);
            $table->string('emplacement_code')->nullable(); // كود الرف أو المكان
            $table->timestamps();

            // ضمان عدم تكرار المادة في نفس المخزن
            $table->unique(['article_id', 'magasin_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};