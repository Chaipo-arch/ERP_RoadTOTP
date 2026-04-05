<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveRequest extends Model
{
    protected $fillable = [
        'employe_id',
        'leave_type_id',
        'start_date',
        'end_date',
        'duration',
        'reason',
        'status',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'duration' => 'decimal:1',
        'approved_at' => 'datetime',
    ];

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'approved_by');
    }

    // ---------------- Méthodes Métier ----------------

    /**
     * Approuve la demande de congé
     */
    public function approve(Employe $manager): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        // Vérifier que le manager peut approuver cette demande
        if (!$this->canBeApprovedBy($manager)) {
            return false;
        }

        $this->update([
            'status' => 'approved',
            'approved_by' => $manager->id,
            'approved_at' => now(),
        ]);

        // TODO: Déduire du solde de congés
        // $this->employe->leaveBalances()
        //     ->where('leave_type_id', $this->leave_type_id)
        //     ->first()
        //     ->deduct($this->duration);

        // TODO: Envoyer notification à l'employé
        // Notification::send($this->employe->user, new LeaveApproved($this));

        return true;
    }

    /**
     * Rejette la demande de congé
     */
    public function reject(Employe $manager, ?string $reason = null): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        // Vérifier que le manager peut rejeter cette demande
        if (!$this->canBeApprovedBy($manager)) {
            return false;
        }

        $this->update([
            'status' => 'rejected',
            'approved_by' => $manager->id,
            'approved_at' => now(),
            'reason' => $reason ?? $this->reason,
        ]);

        // TODO: Envoyer notification à l'employé
        // Notification::send($this->employe->user, new LeaveRejected($this));

        return true;
    }

    /**
     * Annule la demande de congé (par l'employé lui-même)
     */
    public function cancel(): bool
    {
        if (!in_array($this->status, ['pending', 'approved'])) {
            return false;
        }

        $previousStatus = $this->status;

        $this->update([
            'status' => 'cancelled',
        ]);

        // Si c'était déjà approuvé, remettre le solde
        if ($previousStatus === 'approved') {
            // TODO: Restaurer le solde de congés
        }

        return true;
    }

    /**
     * Vérifie si un manager peut approuver cette demande
     */
    public function canBeApprovedBy(Employe $manager): bool
    {
        // Le manager direct peut approuver
        if ($this->employe->manager_id === $manager->id) {
            return true;
        }

        // Un manager supérieur peut aussi approuver
        return $manager->isManagerOf($this->employe);
    }

    /**
     * Calcule la date de fin automatiquement
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($leaveRequest) {
            if ($leaveRequest->start_date && $leaveRequest->duration && !$leaveRequest->end_date) {
                // Calculer la date de fin (en jours ouvrés)
                $leaveRequest->end_date = $leaveRequest->start_date
                    ->copy()
                    ->addWeekdays((int) $leaveRequest->duration - 1);
            }
        });

        static::updating(function ($leaveRequest) {
            if ($leaveRequest->isDirty(['start_date', 'duration']) && !$leaveRequest->isDirty('end_date')) {
                $leaveRequest->end_date = $leaveRequest->start_date
                    ->copy()
                    ->addWeekdays((int) $leaveRequest->duration - 1);
            }
        });
    }
}

