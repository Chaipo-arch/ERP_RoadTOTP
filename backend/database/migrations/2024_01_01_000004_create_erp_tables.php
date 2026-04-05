<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Clients table
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['Public', 'Privé']);
            $table->string('contact_name');
            $table->string('email');
            $table->string('phone');
            $table->text('address')->nullable();
            $table->string('siret', 14)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Chantiers table
        Schema::create('chantiers', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->string('location');
            $table->text('address')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['Planifié', 'En cours', 'Terminé', 'Suspendu'])->default('Planifié');
            $table->unsignedTinyInteger('progress')->default(0);
            $table->decimal('budget', 12, 2);
            $table->decimal('actual_cost', 12, 2)->nullable();
            $table->timestamps();

            $table->index(['status', 'start_date']);
        });

        // Employes table
        Schema::create('employes', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone');
            $table->string('role');
            $table->string('department');
            $table->enum('status', ['Actif', 'Congé', 'Formation', 'Inactif'])->default('Actif');
            $table->text('address')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->timestamps();

            $table->index(['department', 'status']);
        });

        // Materiels table
        Schema::create('materiels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['Engin', 'Véhicule', 'Outillage']);
            $table->string('immatriculation')->unique();
            $table->enum('status', ['Disponible', 'En service', 'Maintenance', 'Hors service'])->default('Disponible');
            $table->decimal('hourly_rate', 8, 2);
            $table->date('purchase_date')->nullable();
            $table->date('last_maintenance')->nullable();
            $table->date('next_maintenance')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['type', 'status']);
        });

        // Pivot: Chantier - Employe
        Schema::create('chantier_employe', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chantier_id')->constrained()->onDelete('cascade');
            $table->foreignId('employe_id')->constrained()->onDelete('cascade');
            $table->string('role')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();

            $table->unique(['chantier_id', 'employe_id']);
        });

        // Pivot: Chantier - Materiel
        Schema::create('chantier_materiel', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chantier_id')->constrained()->onDelete('cascade');
            $table->foreignId('materiel_id')->constrained()->onDelete('cascade');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();

            $table->unique(['chantier_id', 'materiel_id']);
        });

        // Planning Events table
        Schema::create('planning_events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->enum('type', ['chantier', 'livraison', 'maintenance', 'reunion', 'formation', 'inspection']);
            $table->text('description')->nullable();
            $table->date('date');
            $table->date('end_date')->nullable();
            $table->string('time')->nullable();
            $table->string('location')->nullable();
            $table->foreignId('chantier_id')->nullable()->constrained()->onDelete('set null');
            $table->string('team')->nullable();
            $table->timestamps();

            $table->index(['date', 'type']);
        });

        // Maintenances table
        Schema::create('maintenances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('materiel_id')->constrained()->onDelete('cascade');
            $table->date('scheduled_date');
            $table->date('completed_date')->nullable();
            $table->enum('type', ['Préventive', 'Corrective']);
            $table->text('description')->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->enum('status', ['Planifiée', 'En cours', 'Terminée', 'Annulée'])->default('Planifiée');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenances');
        Schema::dropIfExists('planning_events');
        Schema::dropIfExists('chantier_materiel');
        Schema::dropIfExists('chantier_employe');
        Schema::dropIfExists('materiels');
        Schema::dropIfExists('employes');
        Schema::dropIfExists('chantiers');
        Schema::dropIfExists('clients');
    }
};
