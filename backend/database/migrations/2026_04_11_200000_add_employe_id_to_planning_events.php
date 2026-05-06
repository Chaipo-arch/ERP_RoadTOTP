<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('planning_events', function (Blueprint $table) {
            $table->foreignId('employe_id')->nullable()->after('chantier_id')
                  ->constrained('employes')->onDelete('set null');
            $table->string('end_time')->nullable()->after('time');
        });
    }

    public function down(): void
    {
        Schema::table('planning_events', function (Blueprint $table) {
            $table->dropForeign(['employe_id']);
            $table->dropColumn(['employe_id', 'end_time']);
        });
    }
};
