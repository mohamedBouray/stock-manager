<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void{
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('code_barre')->unique();
            $table->string('designation');
            $table->text('description')->nullable();
            $table->string('unite_mesure')->default('pièce'); 
            $table->string('image_url')->nullable();
            $table->integer('quantite_stock')->default(0); 
            $table->integer('seuil_alerte')->default(5);
            $table->integer('seuil_critique')->default(2); 
            $table->decimal('prix_unitaire', 10, 2)->nullable(); 
            $table->string('emplacement')->nullable(); 
            $table->enum('statut', ['actif', 'inactif'])->default('actif');
            $table->foreignId('categorie_id')->constrained('categories')->onDelete('cascade');

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
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};