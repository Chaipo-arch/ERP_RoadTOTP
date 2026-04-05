<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contrats extends Model
{
    protected $fillable = [
        'name',
        'type',
        
    ];

    public function employeContracts(): HasMany
    {
        return $this->hasMany(EmployeContrats::class);
    }
}
