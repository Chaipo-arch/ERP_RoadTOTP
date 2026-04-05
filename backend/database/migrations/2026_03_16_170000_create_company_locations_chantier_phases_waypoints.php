<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Locaux de l'entreprise (siège, agences, dépôts, ateliers)
        Schema::create('company_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->enum('type', ['Siège', 'Agence', 'Dépôt', 'Atelier', 'Autre'])->default('Siège');
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['latitude', 'longitude'], 'company_locations_geo_index');
        });

        // 2. Type de géométrie pour les chantiers (point, ligne, polygone)
        Schema::table('chantiers', function (Blueprint $table) {
            $table->enum('geometry_type', ['point', 'linestring', 'polygon'])
                ->default('point')
                ->after('longitude');
        });

        // 3. Points de géométrie des chantiers (pour lignes et polygones)
        Schema::create('chantier_waypoints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chantier_id')->constrained()->onDelete('cascade');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->unsignedInteger('order_index')->default(0);
            $table->timestamps();

            $table->index(['chantier_id', 'order_index']);
        });

        // 4. Phases / étapes d'un chantier
        Schema::create('chantier_phases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chantier_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('order_index')->default(0);
            $table->enum('status', ['À faire', 'En cours', 'Terminée', 'Bloquée'])->default('À faire');
            $table->date('planned_start')->nullable();
            $table->date('planned_end')->nullable();
            $table->date('actual_start')->nullable();
            $table->date('actual_end')->nullable();
            $table->unsignedTinyInteger('progress')->default(0);
            $table->decimal('budget', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['chantier_id', 'order_index']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chantier_phases');
        Schema::dropIfExists('chantier_waypoints');

        Schema::table('chantiers', function (Blueprint $table) {
            $table->dropColumn('geometry_type');
        });

        Schema::dropIfExists('company_locations');
    }
};
