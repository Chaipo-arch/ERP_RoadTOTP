<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractTemplate extends Model
{
    use HasFactory, \App\Traits\BelongsToCompany;

    protected $fillable = [
        'company_id',
        'user_id',
        'name',
        'category',
        'content',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'content' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
