<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Models\Employe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeaveRequestController extends Controller
{
    /**
     * Liste des demandes de congés avec filtres
     */
    public function index(Request $request): JsonResponse
    {
        $query = LeaveRequest::with(['employe', 'leaveType', 'approvedBy']);

        // Filtre par employé
        if ($request->has('employe_id')) {
            $query->where('employe_id', $request->employe_id);
        }

        // Filtre par statut
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filtre par type de congé
        if ($request->has('leave_type_id')) {
            $query->where('leave_type_id', $request->leave_type_id);
        }

        // Filtre par période
        if ($request->has('start_date')) {
            $query->where('start_date', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->where('end_date', '<=', $request->end_date);
        }

        // Filtre pour manager : voir les demandes de ses subordonnés
        if ($request->has('manager_id')) {
            $manager = Employe::find($request->manager_id);
            if ($manager) {
                $subordinateIds = $manager->getAllSubordinates()->pluck('id');
                $query->whereIn('employe_id', $subordinateIds);
            }
        }

        // Tri par date (plus récent en premier)
        $query->orderBy('created_at', 'desc');

        return response()->json($query->paginate(20));
    }

    /**
     * Créer une nouvelle demande de congé
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employe_id' => 'required|exists:employes,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'duration' => 'required|numeric|min:0.5',
            'reason' => 'nullable|string|max:500',
        ]);

        // Vérifier le solde disponible
        $employe = Employe::find($validated['employe_id']);
        $balance = $employe->leaveBalances()
            ->where('leave_type_id', $validated['leave_type_id'])
            ->first();

        if (!$balance || $balance->balance < $validated['duration']) {
            return response()->json([
                'message' => 'Solde de congés insuffisant',
                'available' => $balance ? $balance->balance : 0,
                'requested' => $validated['duration'],
            ], 422);
        }

        // Créer la demande avec status 'pending'
        $validated['status'] = 'pending';
        $leaveRequest = LeaveRequest::create($validated);

        // Charger les relations pour la réponse
        $leaveRequest->load(['employe', 'leaveType']);

        // TODO: Notification au manager
        // if ($employe->manager) {
        //     $employe->manager->notify(new NewLeaveRequest($leaveRequest));
        // }

        return response()->json($leaveRequest, 201);
    }

    /**
     * Afficher une demande spécifique
     */
    public function show(LeaveRequest $leaveRequest): JsonResponse
    {
        $leaveRequest->load(['employe', 'leaveType', 'approvedBy']);
        return response()->json($leaveRequest);
    }

    /**
     * Mettre à jour une demande (seulement si pending)
     */
    public function update(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        if ($leaveRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Impossible de modifier une demande déjà traitée',
            ], 422);
        }

        $validated = $request->validate([
            'start_date' => 'sometimes|date',
            'duration' => 'sometimes|numeric|min:0.5',
            'reason' => 'nullable|string|max:500',
        ]);

        $leaveRequest->update($validated);
        $leaveRequest->load(['employe', 'leaveType']);

        return response()->json($leaveRequest);
    }

    /**
     * Supprimer une demande (seulement si pending)
     */
    public function destroy(LeaveRequest $leaveRequest): JsonResponse
    {
        if ($leaveRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Impossible de supprimer une demande déjà traitée',
            ], 422);
        }

        $leaveRequest->delete();
        return response()->json(null, 204);
    }

    /**
     * Approuver une demande de congé (manager uniquement)
     */
    public function approve(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        // Récupérer l'employé manager (via l'auth user)
        $user = $request->user();
        $manager = Employe::where('company_id', $user->company_id)
            ->where('email', $user->email)
            ->first();

        if (!$manager) {
            return response()->json([
                'message' => 'Employé manager non trouvé',
            ], 404);
        }

        // Tenter l'approbation
        $success = $leaveRequest->approve($manager);

        if (!$success) {
            return response()->json([
                'message' => $leaveRequest->status !== 'pending'
                    ? 'Cette demande a déjà été traitée'
                    : 'Vous n\'êtes pas autorisé à approuver cette demande',
            ], 422);
        }

        // Déduire du solde
        DB::transaction(function () use ($leaveRequest) {
            $balance = $leaveRequest->employe->leaveBalances()
                ->where('leave_type_id', $leaveRequest->leave_type_id)
                ->first();

            if ($balance) {
                $balance->decrement('balance', $leaveRequest->duration);

                // Enregistrer la transaction
                $leaveRequest->employe->leaveTransactions()->create([
                    'leave_type_id' => $leaveRequest->leave_type_id,
                    'amount' => -$leaveRequest->duration,
                    'source' => 'request',
                    'comment' => "Demande #{$leaveRequest->id} approuvée",
                ]);
            }
        });

        $leaveRequest->load(['employe', 'leaveType', 'approvedBy']);

        return response()->json([
            'message' => 'Demande de congé approuvée avec succès',
            'data' => $leaveRequest,
        ]);
    }

    /**
     * Rejeter une demande de congé (manager uniquement)
     */
    public function reject(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        // Récupérer l'employé manager (via l'auth user)
        $user = $request->user();
        $manager = Employe::where('company_id', $user->company_id)
            ->where('email', $user->email)
            ->first();

        if (!$manager) {
            return response()->json([
                'message' => 'Employé manager non trouvé',
            ], 404);
        }

        // Tenter le rejet
        $success = $leaveRequest->reject($manager, $validated['reason'] ?? null);

        if (!$success) {
            return response()->json([
                'message' => $leaveRequest->status !== 'pending'
                    ? 'Cette demande a déjà été traitée'
                    : 'Vous n\'êtes pas autorisé à rejeter cette demande',
            ], 422);
        }

        $leaveRequest->load(['employe', 'leaveType', 'approvedBy']);

        return response()->json([
            'message' => 'Demande de congé rejetée',
            'data' => $leaveRequest,
        ]);
    }

    /**
     * Annuler une demande (employé uniquement)
     */
    public function cancel(LeaveRequest $leaveRequest): JsonResponse
    {
        $success = $leaveRequest->cancel();

        if (!$success) {
            return response()->json([
                'message' => 'Impossible d\'annuler cette demande',
            ], 422);
        }

        $leaveRequest->load(['employe', 'leaveType']);

        return response()->json([
            'message' => 'Demande de congé annulée',
            'data' => $leaveRequest,
        ]);
    }

    /**
     * Obtenir le solde de congés d'un employé
     */
    public function balance(Employe $employe): JsonResponse
    {
        $balances = $employe->leaveBalances()->with('leaveType')->get();

        return response()->json([
            'employe' => [
                'id' => $employe->id,
                'full_name' => $employe->full_name,
            ],
            'balances' => $balances->map(function ($balance) {
                return [
                    'leave_type' => $balance->leaveType->name,
                    'balance' => (float) $balance->balance,
                    'is_paid' => $balance->leaveType->is_paid,
                ];
            }),
        ]);
    }
}
