<?php
// database/migrations/2026_05_23_130000_add_missing_columns_to_inventaire_lignes_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventaire_lignes', function (Blueprint $table) {
            // Vérifier si la colonne n'existe pas avant de l'ajouter
            if (!Schema::hasColumn('inventaire_lignes', 'quantite_theorique')) {
                $table->integer('quantite_theorique')->default(0)->after('article_id');
            }
            
            if (!Schema::hasColumn('inventaire_lignes', 'quantite_reelle')) {
                $table->integer('quantite_reelle')->default(0)->after('quantite_theorique');
            }
            
            if (!Schema::hasColumn('inventaire_lignes', 'ecart')) {
                $table->integer('ecart')->default(0)->after('quantite_reelle');
            }
            
            if (!Schema::hasColumn('inventaire_lignes', 'observations')) {
                $table->text('observations')->nullable()->after('ecart');
            }
            
            if (!Schema::hasColumn('inventaire_lignes', 'est_corrige')) {
                $table->boolean('est_corrige')->default(false)->after('observations');
            }
        });
    }

    public function down(): void
    {
        Schema::table('inventaire_lignes', function (Blueprint $table) {
            $columns = ['quantite_theorique', 'quantite_reelle', 'ecart', 'observations', 'est_corrige'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('inventaire_lignes', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};