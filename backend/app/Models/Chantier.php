<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chantier extends Model
{
    use HasFactory, \App\Traits\BelongsToCompany;

    protected $fillable = [
        'reference',
        'name',
        'description',
        'client_id',
        'location',
        'address',
        'latitude',
        'longitude',
        'geometry_type',
        'start_date',
        'end_date',
        'status',
        'progress',
        'budget',
        'actual_cost',
        'company_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'budget' => 'decimal:2',
        'actual_cost' => 'decimal:2',
        'progress' => 'integer',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function employes(): BelongsToMany
    {
        return $this->belongsToMany(Employe::class, 'chantier_employe')
            ->withPivot('role', 'start_date', 'end_date')
            ->withTimestamps();
    }

    public function materiels(): BelongsToMany
    {
        return $this->belongsToMany(Materiel::class, 'chantier_materiel')
            ->withPivot('start_date', 'end_date')
            ->withTimestamps();
    }

    public function events()
    {
        return $this->hasMany(PlanningEvent::class);
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function waypoints(): HasMany
    {
        return $this->hasMany(ChantierWaypoint::class)->orderBy('order_index');
    }

    public function phases(): HasMany
    {
        return $this->hasMany(ChantierPhase::class)->orderBy('order_index');
    }

    /**
     * Recalculates chantier progress based on phase completion
     */
    public function recalculateProgress(): void
    {
        $phases = $this->phases;
        if ($phases->isEmpty()) return;

        $totalProgress = $phases->avg('progress');
        $this->update(['progress' => round($totalProgress)]);
    }

    public static function generateReference(): string
    {
        $year = date('Y');
        $lastChantier = self::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $number = $lastChantier ? intval(substr($lastChantier->reference, -3)) + 1 : 1;
        return "CH-{$year}-" . str_pad($number, 3, '0', STR_PAD_LEFT);
    }
}

