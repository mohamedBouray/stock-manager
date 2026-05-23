<?php
// database/migrations/2026_05_23_000000_add_magasin_id_to_users_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('magasin_id')->nullable()->constrained('magasins')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['magasin_id']);
            $table->dropColumn('magasin_id');
        });
    }
};