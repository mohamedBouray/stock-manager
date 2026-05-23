<?php
// database/migrations/2026_05_23_000000_add_quantite_retournee_to_demandes_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('demandes', function (Blueprint $table) {
            // Ajouter la colonne quantite_retournee (défaut 0)
            $table->integer('quantite_retournee')->default(0)->after('quantite_accorde');
        });
    }

    public function down(): void
    {
        Schema::table('demandes', function (Blueprint $table) {
            $table->dropColumn('quantite_retournee');
        });
    }
};