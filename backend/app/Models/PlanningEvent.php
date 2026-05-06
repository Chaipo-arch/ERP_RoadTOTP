<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanningEvent extends Model
{
    use HasFactory, \App\Traits\BelongsToCompany;

    protected $fillable = [
        'title',
        'type',
        'description',
        'date',
        'end_date',
        'time',
        'end_time',
        'location',
        'chantier_id',
        'employe_id',
        'team',
        'company_id',
    ];

    protected $casts = [
        'date' => 'date',
        'end_date' => 'date',
    ];

    public function chantier(): BelongsTo
    {
        return $this->belongsTo(Chantier::class);
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }
}
