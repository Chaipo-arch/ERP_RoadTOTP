<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            // Ajouter la relation hiérarchique (self-reference)
            $table->foreignId('manager_id')
                ->nullable()
                ->after('company_id')
                ->constrained('employes')
                ->onDelete('set null');

            // Index pour optimiser les requêtes hiérarchiques
            $table->index('manager_id', 'idx_employes_manager');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            $table->dropForeign(['manager_id']);
            $table->dropIndex('idx_employes_manager');
            $table->dropColumn('manager_id');
        });
    }
};
