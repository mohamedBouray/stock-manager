<?php
// database/migrations/2026_05_22_000004_add_missing_columns_to_articles_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            // Blocage article pour achat/mouvement
            $table->boolean('is_blocked')->default(false)->after('statut');
            $table->timestamp('blocked_at')->nullable()->after('is_blocked');
            $table->text('blocked_reason')->nullable()->after('blocked_at');
            $table->foreignId('blocked_by')->nullable()->constrained('users')->after('blocked_reason');
            
            // Champs manquants pour conformité cahier des charges
            $table->string('marque')->nullable()->after('description');
            $table->string('modele')->nullable()->after('marque');
            $table->decimal('prix_achat', 10, 2)->nullable()->after('prix_unitaire');
            $table->string('fournisseur_principal')->nullable()->after('prix_achat');
            
            // Index
            $table->index('is_blocked');
            $table->index('marque');
        });
        
        // Table pour l'archivage des commandes
        Schema::table('commandes_fournisseurs', function (Blueprint $table) {
            $table->boolean('is_archived')->default(false)->after('statut');
            $table->timestamp('archived_at')->nullable()->after('is_archived');
            $table->index('is_archived');
        });
        
        // Table pour l'archivage des documents
        Schema::create('documents_archives', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // BC, BR, Demande, Rapport
            $table->string('reference');
            $table->string('filename');
            $table->string('filepath');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->index('type');
            $table->index('reference');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn([
                'is_blocked', 'blocked_at', 'blocked_reason', 'blocked_by',
                'marque', 'modele', 'prix_achat', 'fournisseur_principal'
            ]);
        });
        
        Schema::table('commandes_fournisseurs', function (Blueprint $table) {
            $table->dropColumn(['is_archived', 'archived_at']);
        });
        
        Schema::dropIfExists('documents_archives');
    }
};