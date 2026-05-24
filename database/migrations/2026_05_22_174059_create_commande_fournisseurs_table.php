<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void{
        Schema::create('commandes_fournisseurs', function (Blueprint $table) {
            $table->id();
            $table->string('numero_commande')->unique();
            $table->string('fournisseur')->default('Ministère du Tourisme');
            $table->date('date_commande');
            $table->enum('statut', ['envoyee', 'partiellement_livree', 'livree_totalement'])->default('envoyee');
            $table->boolean('is_archived')->default(false)->after('statut');
            $table->timestamp('archived_at')->nullable()->after('is_archived');
            $table->index('is_archived');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commande_fournisseurs');
    }
};
