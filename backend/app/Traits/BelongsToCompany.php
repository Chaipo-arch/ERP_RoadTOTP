<?php

namespace App\Traits;

use App\Models\Company;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait BelongsToCompany
{
    protected static function bootBelongsToCompany()
    {
        static::addGlobalScope('company', function (Builder $builder) {
            // On vérifie si on est dans la console (migrations/seeders)
            if (app()->runningInConsole()) return;

            // On utilise directement la session ou l'ID pour éviter de re-trigger l'objet User complet
            $companyId = auth()->user()->company_id ?? null;

            if ($companyId) {
                $table = $builder->getModel()->getTable();
                $builder->where($table . '.company_id', $companyId);
            }
        });
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
