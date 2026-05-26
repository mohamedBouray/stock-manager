<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents_archives', function (Blueprint $table) {
            $table->id();
            $table->string('type'); 
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
        Schema::dropIfExists('documents_archives');
    }
};