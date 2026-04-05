<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ajout des colonnes de géolocalisation pour les matériels (capteurs Sensolus)
        Schema::table('materiels', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('notes');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->string('sensolus_device_id')->nullable()->unique()->after('longitude');
            $table->string('sensolus_tracker_name')->nullable()->after('sensolus_device_id');
            $table->timestamp('last_position_at')->nullable()->after('sensolus_tracker_name');

            $table->index(['latitude', 'longitude'], 'materiels_geolocation_index');
        });

        // Ajout des colonnes de géolocalisation pour les chantiers
        Schema::table('chantiers', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('address');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');

            $table->index(['latitude', 'longitude'], 'chantiers_geolocation_index');
        });
    }

    public function down(): void
    {
        Schema::table('materiels', function (Blueprint $table) {
            $table->dropIndex('materiels_geolocation_index');
            $table->dropColumn(['latitude', 'longitude', 'sensolus_device_id', 'sensolus_tracker_name', 'last_position_at']);
        });

        Schema::table('chantiers', function (Blueprint $table) {
            $table->dropIndex('chantiers_geolocation_index');
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
