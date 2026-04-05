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
            // Renommer 'role' en 'job_title' pour éviter confusion avec users.role_id (permissions)
            $table->renameColumn('role', 'job_title');
        });

        // Faire la même chose dans la table pivot chantier_employe si elle existe
        if (Schema::hasTable('chantier_employe') && Schema::hasColumn('chantier_employe', 'role')) {
            Schema::table('chantier_employe', function (Blueprint $table) {
                $table->renameColumn('role', 'job_title');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employes', function (Blueprint $table) {
            $table->renameColumn('job_title', 'role');
        });

        if (Schema::hasTable('chantier_employe') && Schema::hasColumn('chantier_employe', 'job_title')) {
            Schema::table('chantier_employe', function (Blueprint $table) {
                $table->renameColumn('job_title', 'role');
            });
        }
    }
};
