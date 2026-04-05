<?php
namespace App\Http\Services;

use Carbon\Carbon;
use App\Models\Employe;
use App\Models\LeaveType;
use App\Models\LeaveBalance;
use App\Models\LeaveTransaction;
use App\Models\LeaveRequest;

class LeaveAccrualService
{
    public function accrue()
    {
        $employees = Employe::where('status','Actif')->orWhere('status','active')->get();
        $leaveTypes = LeaveType::where('accrual_rate', '>', 0)->get();

        foreach ($employees as $emp) {

            $hasActiveContract = false;

            if ($emp->contracts()->exists()) {
                $hasActiveContract = $emp->contracts()
                    ->whereDate('start_date', '<=', now())
                    ->where(function($q) {
                        $q->whereNull('end_date')
                          ->orWhere('end_date', '>=', now());
                    })->exists();
            } else {
                // Si l'ERP n'a pas encore de contrats enregistrés pour cet employé,
                // on se fie à son statut 'Actif' (déjà filtré) et sa date d'embauche.
                if (!$emp->hire_date || $emp->hire_date <= now()) {
                    $hasActiveContract = true;
                }
            }

            if (!$hasActiveContract) continue;

            $this->accrueForEmployee($emp, $leaveTypes);
        }
    }

    private function accrueForEmployee($emp, $leaveTypes)
    {
        foreach ($leaveTypes as $type) {
            $rate = $this->determineRate($emp, $type);

            if ($rate <= 0) continue;

            $balance = LeaveBalance::firstOrCreate([
                'employe_id' => $emp->id,
                'leave_type_id' => $type->id
            ]);

            $yearTotal = LeaveTransaction::whereYear('created_at', now()->year)
                ->where('employe_id', $emp->id)
                ->where('leave_type_id', $type->id)
                ->sum('amount');

            if ($type->yearly_cap && $yearTotal >= $type->yearly_cap) {
                continue;
            }

            $amountToAdd = $rate;

            if ($type->yearly_cap && ($yearTotal + $rate) > $type->yearly_cap) {
                $amountToAdd = $type->yearly_cap - $yearTotal;
            }

            if ($amountToAdd > 0) {
                $balance->balance += $amountToAdd;
                $balance->save();

                LeaveTransaction::create([
                    'employe_id' => $emp->id,
                    'leave_type_id' => $type->id,
                    'amount' => $amountToAdd,
                    'source' => 'accrual',
                    'comment' => 'Monthly accrual'
                ]);
            }
        }
    }

    private function determineRate($emp, $type)
    {
        if (strtolower($type->name) === 'congés payés') {
            $maladieNonProId = LeaveType::where('name','Maladie non pro')->value('id');
            $maladieProId = LeaveType::where('name','Maladie pro')->value('id');
            
            $sick = false;
            if ($maladieNonProId || $maladieProId) {
                $sick = LeaveRequest::where('employe_id',$emp->id)
                    ->whereMonth('start_date',now()->month)
                    ->whereIn('leave_type_id', array_filter([$maladieNonProId, $maladieProId]))
                    ->exists();
            }

            if (!$sick) return $type->accrual_rate;

            $sickType = LeaveRequest::where('employe_id',$emp->id)
                ->latest()->first()
                ->leaveType;

            return $sickType ? $sickType->accrual_rate : $type->accrual_rate;
        }

        return $type->accrual_rate;
    }
}




?>