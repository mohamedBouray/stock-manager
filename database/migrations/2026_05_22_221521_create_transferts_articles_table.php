<?php
// database/migrations/2026_05_22_000001_create_transferts_articles_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transferts_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_source_id')->constrained('articles')->onDelete('cascade');
            $table->foreignId('article_dest_id')->constrained('articles')->onDelete('cascade');
            $table->foreignId('magasin_id')->constrained('magasins')->onDelete('cascade');
            $table->integer('quantite');
            $table->text('motif')->nullable();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            // Index pour performance
            $table->index('article_source_id');
            $table->index('article_dest_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transferts_articles');
    }
};