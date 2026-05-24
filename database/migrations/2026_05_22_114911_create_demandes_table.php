<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demandes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('article_id')->constrained();
            $table->integer('quantite_demandee');
            $table->integer('quantite_accorde')->nullable();
            $table->enum('statut', ['en_attente', 'approuvee', 'refusee', 'livree'])->default('en_attente');
            $table->text('motif')->nullable();
            $table->text('commentaire_refus')->nullable();
            $table->timestamp('date_demande')->useCurrent();
            $table->timestamp('date_traitement')->nullable();
            $table->foreignId('traite_par')->nullable()->constrained('users');
            $table->boolean('is_archived')->default(false);
            $table->timestamp('archived_at')->nullable();
            $table->integer('quantite_retournee')->default(0)->after('quantite_accorde');
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('demandes');
    }
};