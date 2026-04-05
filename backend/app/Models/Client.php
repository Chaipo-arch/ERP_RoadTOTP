<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory, \App\Traits\BelongsToCompany;

    protected $fillable = [
        'name',
        'type',
        'contact_name',
        'email',
        'phone',
        'address',
        'siret',
        'notes',
        'company_id',
    ];

    public function chantiers(): HasMany
    {
        return $this->hasMany(Chantier::class);
    }

    public function activeChantiers()
    {
        return $this->chantiers()->whereIn('status', ['En cours', 'Planifié']);
    }

    public function getTotalRevenueAttribute()
    {
        return $this->chantiers()->sum('budget');
    }

    public function getActiveContractsCountAttribute()
    {
        return $this->activeChantiers()->count();
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}
