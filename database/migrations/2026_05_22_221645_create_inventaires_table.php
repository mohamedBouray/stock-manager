<?php
// database/migrations/2026_05_22_000003_create_inventaires_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventaires', function (Blueprint $table) {
            $table->id();
            $table->string('numero_inventaire')->unique();
            $table->foreignId('magasin_id')->constrained('magasins')->onDelete('cascade');
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->enum('statut', ['planifie', 'en_cours', 'finalise', 'annule'])->default('planifie');
            $table->foreignId('responsable_id')->constrained('users')->onDelete('cascade');
            $table->text('commentaire')->nullable();
            $table->timestamps();
            
            $table->index('statut');
            $table->index('date_debut');
        });

        Schema::create('inventaire_lignes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventaire_id')->constrained('inventaires')->onDelete('cascade');
            $table->foreignId('article_id')->constrained('articles')->onDelete('cascade');
            $table->integer('quantite_theorique');
            $table->integer('quantite_reelle');
            $table->integer('ecart');
            $table->text('observations')->nullable();
            $table->boolean('est_corrige')->default(false);
            $table->timestamps();
            
            $table->unique(['inventaire_id', 'article_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventaire_lignes');
        Schema::dropIfExists('inventaires');
    }
};