<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Team extends Model
{
    use HasFactory, \App\Traits\BelongsToCompany;

    protected $fillable = [
        'name',
        'description',
        'manager_id',
        'company_id',
    ];

    protected $with = ['manager']; // Eager load par défaut

    // ---------------- Relations ----------------

    /**
     * Manager de l'équipe
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'manager_id');
    }

    /**
     * Membres de l'équipe
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(Employe::class, 'team_members')
            ->withPivot('joined_at')
            ->withTimestamps();
    }

    // ---------------- Méthodes Utilitaires ----------------

    /**
     * Ajoute un membre à l'équipe
     */
    public function addMember(Employe $employe, ?\DateTime $joinedAt = null): void
    {
        if (!$this->members()->where('employe_id', $employe->id)->exists()) {
            $this->members()->attach($employe->id, [
                'joined_at' => $joinedAt ?? now()->toDateString(),
            ]);
        }
    }

    /**
     * Retire un membre de l'équipe
     */
    public function removeMember(Employe $employe): void
    {
        $this->members()->detach($employe->id);
    }

    /**
     * Vérifie si un employé est membre de l'équipe
     */
    public function hasMember(Employe $employe): bool
    {
        return $this->members()->where('employe_id', $employe->id)->exists();
    }

    /**
     * Nombre de membres dans l'équipe
     */
    public function getMembersCountAttribute(): int
    {
        return $this->members()->count();
    }
}
