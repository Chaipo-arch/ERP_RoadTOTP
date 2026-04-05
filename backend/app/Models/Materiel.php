<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Materiel extends Model
{
    use HasFactory, \App\Traits\BelongsToCompany;

    protected $fillable = [
        'name',
        'type',
        'immatriculation',
        'status',
        'hourly_rate',
        'purchase_date',
        'last_maintenance',
        'next_maintenance',
        'notes',
        'company_id',
        'latitude',
        'longitude',
        'sensolus_device_id',
        'sensolus_tracker_name',
        'last_position_at',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'last_maintenance' => 'date',
        'next_maintenance' => 'date',
        'hourly_rate' => 'decimal:2',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'last_position_at' => 'datetime',
    ];

    public function chantiers(): BelongsToMany
    {
        return $this->belongsToMany(Chantier::class, 'chantier_materiel')
            ->withPivot('start_date', 'end_date')
            ->withTimestamps();
    }

    public function maintenances(): HasMany
    {
        return $this->hasMany(Maintenance::class);
    }

    public function currentChantier()
    {
        return $this->chantiers()
            ->wherePivot('end_date', '>=', now())
            ->orWherePivotNull('end_date')
            ->first();
    }

    public function needsMaintenance(): bool
    {
        return $this->next_maintenance && $this->next_maintenance->lte(now()->addDays(7));
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}
