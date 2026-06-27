<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class ContractTemplate extends Model
{
    use HasFactory, \App\Traits\BelongsToCompany;

    protected $fillable = [
        'company_id',
        'user_id',
        'documents_id',
        'name',
        'category',
        'description',
        'is_active',
        'document_id', // Requis pour l'update
        
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
    public function document(): BelongsTo 
    {
       return $this->belongsTo(Document::class); 
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /* 💡 CORRECTION DU MAPPING POUR LE DOCUMENT CONTROLLER
     * On force la relation polymorphique sur 'model' au lieu de 'documentable'
     * car DocumentController exécute ses requêtes via model_type et model_id.
     */
    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'model', 'documentable_type', 'documentable_id');
    }
}
