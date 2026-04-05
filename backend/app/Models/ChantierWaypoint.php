<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChantierWaypoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'chantier_id',
        'latitude',
        'longitude',
        'order_index',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'order_index' => 'integer',
    ];

    public function chantier()
    {
        return $this->belongsTo(Chantier::class);
    }
}
