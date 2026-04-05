<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            // Ajouter le manager qui valide/rejette
            $table->foreignId('approved_by')
                ->nullable()
                ->after('status')
                ->constrained('employes')
                ->onDelete('set null');
            
            // Date de validation
            $table->timestamp('approved_at')
                ->nullable()
                ->after('approved_by');
            
            // Date de fin (calculée depuis start_date + duration)
            $table->date('end_date')
                ->nullable()
                ->after('start_date');
            
            // Index pour performance
            $table->index(['status', 'employe_id']);
            $table->index('approved_by');
        });

        // Modifier la colonne status pour utiliser ENUM au lieu de string libre
        // Note: MySQL permet de modifier un VARCHAR en ENUM
        DB::statement("ALTER TABLE leave_requests MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revenir à VARCHAR pour status
        DB::statement("ALTER TABLE leave_requests MODIFY COLUMN status VARCHAR(255) DEFAULT 'pending'");
        
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropIndex(['status', 'employe_id']);
            $table->dropIndex(['approved_by']);
            $table->dropColumn(['approved_by', 'approved_at', 'end_date']);
        });
    }
};
