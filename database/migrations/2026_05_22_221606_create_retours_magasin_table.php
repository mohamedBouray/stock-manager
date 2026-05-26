<?php
// database/migrations/2026_05_22_000002_create_retours_magasin_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retours_magasin', function (Blueprint $table) {
            $table->id();
            $table->foreignId('demande_id')->constrained('demandes')->onDelete('cascade');
            $table->foreignId('article_id')->constrained('articles')->onDelete('cascade');
            $table->integer('quantite');
            $table->text('motif');
            $table->text('motif_refus')->nullable();
            $table->enum('statut', ['en_attente', 'approuve', 'refuse'])->default('en_attente');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('date_traitement')->nullable();
            $table->timestamps();
            
            $table->index('statut');
            $table->index('demande_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retours_magasin');
    }
};