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
        // Table teams
        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            
            // Manager de l'équipe (FK vers employes)
            $table->foreignId('manager_id')
                ->nullable()
                ->constrained('employes')
                ->onDelete('set null');
            
            // Multi-tenancy
            $table->foreignId('company_id')
                ->constrained('companies')
                ->onDelete('cascade');
            
            $table->timestamps();
            
            // Index
            $table->index(['company_id', 'manager_id']);
        });

        // Table pivot team_members
        Schema::create('team_members', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('team_id')
                ->constrained('teams')
                ->onDelete('cascade');
            
            $table->foreignId('employe_id')
                ->constrained('employes')
                ->onDelete('cascade');
            
            // Date de jonction dans l'équipe
            $table->date('joined_at')->nullable();
            
            $table->timestamps();
            
            // Constraint unique : un employé ne peut être qu'une fois dans une équipe
            $table->unique(['team_id', 'employe_id']);
            
            // Index pour performance
            $table->index('employe_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('team_members');
        Schema::dropIfExists('teams');
    }
};
