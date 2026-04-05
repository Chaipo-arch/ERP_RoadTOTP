<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class Employe extends Model
{
    use HasFactory, \App\Traits\BelongsToCompany;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'job_title', // Renommé de 'role' pour éviter confusion avec permissions
        'department',
        'hire_date',
        'status',
        'address',
        'emergency_contact',
        'company_id',
        'manager_id',
        'user_id',
    ];

    protected $casts = [
        'hire_date' => 'date',
    ];

    protected $appends = ['full_name'];

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    // ---------------- Hiérarchie ----------------

    /**
     * Manager direct de l'employé
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'manager_id');
    }

    /**
     * Employés directement supervisés (subordonnés directs)
     */
    public function subordinates(): HasMany
    {
        return $this->hasMany(Employe::class, 'manager_id');
    }

    /**
     * Récupère tous les subordonnés (récursif)
     */
    public function getAllSubordinates(): Collection
    {
        $subordinates = collect();

        foreach ($this->subordinates as $subordinate) {
            $subordinates->push($subordinate);
            $subordinates = $subordinates->merge($subordinate->getAllSubordinates());
        }

        return $subordinates;
    }

    /**
     * Récupère le chemin hiérarchique jusqu'à la racine
     */
    public function getHierarchyPath(): Collection
    {
        $path = collect([$this]);
        $current = $this;

        while ($current->manager) {
            $current = $current->manager;
            $path->prepend($current);
        }

        return $path;
    }

    /**
     * Vérifie si cet employé est le manager (direct ou indirect) d'un autre
     */
    public function isManagerOf(Employe $employee): bool
    {
        return $this->getAllSubordinates()->contains('id', $employee->id);
    }

    // ---------------- Équipes ----------------

    /**
     * Équipes dont l'employé est membre
     */
    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class, 'team_members')
            ->withPivot('joined_at')
            ->withTimestamps();
    }

    /**
     * Équipes dont l'employé est manager
     */
    public function managedTeams(): HasMany
    {
        return $this->hasMany(Team::class, 'manager_id');
    }

    // ---------------- RH / Congés ----------------

    public function contracts(): HasMany
    {
        return $this->hasMany(EmployeContrats::class);
    }

    public function leaveBalances(): HasMany
    {
        return $this->hasMany(LeaveBalance::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function leaveTransactions(): HasMany
    {
        return $this->hasMany(LeaveTransaction::class);
    }

    /**
     * Demandes de congés approuvées par cet employé (si manager)
     */
    public function approvedLeaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'approved_by');
    }

    // ---------------- Chantier ----------------

    public function chantiers(): BelongsToMany
    {
        return $this->belongsToMany(Chantier::class, 'chantier_employe')
            ->withPivot('role','start_date','end_date')
            ->withTimestamps();
    }

    public function currentChantier()
    {
        return $this->chantiers()
            ->where(function($q){
                $q->wherePivotNull('end_date')
                  ->orWherePivot('end_date','>=',now());
            })->first();
    }

    public function documents()
    {
        return $this->morphMany(Document::class,'documentable');
    }
}
