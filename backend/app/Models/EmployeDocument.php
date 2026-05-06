<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeDocument extends Model
{
    use HasFactory;

    protected $table = 'employe_documents';

    protected $fillable = [
        'employe_id',
        'company_id',
        'user_id',
        'name',
        'type',
        'content',
    ];

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
