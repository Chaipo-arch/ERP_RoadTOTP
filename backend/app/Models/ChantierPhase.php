<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChantierPhase extends Model
{
    use HasFactory;

    protected $fillable = [
        'chantier_id',
        'name',
        'description',
        'order_index',
        'status',
        'planned_start',
        'planned_end',
        'actual_start',
        'actual_end',
        'progress',
        'budget',
        'notes',
    ];

    protected $casts = [
        'planned_start' => 'date',
        'planned_end' => 'date',
        'actual_start' => 'date',
        'actual_end' => 'date',
        'progress' => 'integer',
        'budget' => 'decimal:2',
        'order_index' => 'integer',
    ];

    public function chantier()
    {
        return $this->belongsTo(Chantier::class);
    }

    public function isDelayed(): bool
    {
        if (!$this->planned_end || $this->status === 'Terminée') return false;
        return now()->gt($this->planned_end) && $this->status !== 'Terminée';
    }
}
