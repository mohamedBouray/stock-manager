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
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};