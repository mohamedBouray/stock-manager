<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bons_receptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commande_id')->constrained('commandes_fournisseurs')->onDelete('cascade');
            $table->string('numero_bon');
            $table->date('date_reception');
            $table->timestamps();
        });

        Schema::create('lignes_bon_reception', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bon_reception_id')->constrained('bons_receptions')->onDelete('cascade');
            $table->foreignId('article_id')->constrained('articles')->onDelete('cascade');
            $table->integer('quantite_recue');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lignes_bon_reception');
        Schema::dropIfExists('bons_reception');
    }
};
