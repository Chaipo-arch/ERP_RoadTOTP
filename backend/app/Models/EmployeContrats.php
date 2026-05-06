<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeContrats extends Model
{
    protected $table = 'employes_contract';

    protected $fillable = [
        'employe_id',
        'contrat_id',
        'job_title',
        'hourly_salary',
        'hourly_rate',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'hourly_salary' => 'decimal:2',
    ];

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }

    public function contrat(): BelongsTo
    {
        return $this->belongsTo(Contrat::class);
    }
    
}
