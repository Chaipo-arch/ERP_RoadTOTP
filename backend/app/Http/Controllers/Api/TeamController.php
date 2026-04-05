<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\Employe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    /**
     * Liste des équipes
     */
    public function index(Request $request): JsonResponse
    {
        $query = Team::with(['manager', 'members']);

        // Filtre par company (via middleware BelongsToCompany)
        // La company_id est déjà scopée par le trait

        // Filtre par manager
        if ($request->has('manager_id')) {
            $query->where('manager_id', $request->manager_id);
        }

        // Recherche par nom
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $teams = $query->get();

        // Ajouter le nombre de membres à chaque équipe
        $teams->each(function ($team) {
            $team->members_count = $team->members->count();
        });

        return response()->json($teams);
    }

    /**
     * Créer une nouvelle équipe
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:employes,id',
        ]);

        // Ajouter company_id depuis l'utilisateur authentifié
        $validated['company_id'] = $request->user()->company_id;

        $team = Team::create($validated);
        $team->load(['manager', 'members']);

        return response()->json($team, 201);
    }

    /**
     * Afficher une équipe spécifique
     */
    public function show(Team $team): JsonResponse
    {
        $team->load(['manager', 'members' => function ($query) {
            $query->withPivot('joined_at')
                ->orderBy('team_members.joined_at', 'desc');
        }]);

        // Ajouter des infos supplémentaires
        $team->members_count = $team->members->count();

        return response()->json($team);
    }

    /**
     * Mettre à jour une équipe
     */
    public function update(Request $request, Team $team): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:employes,id',
        ]);

        $team->update($validated);
        $team->load(['manager', 'members']);

        return response()->json($team);
    }

    /**
     * Supprimer une équipe
     */
    public function destroy(Team $team): JsonResponse
    {
        // Note: Les members seront automatiquement supprimés (cascade dans pivot)
        $team->delete();
        return response()->json(null, 204);
    }

    /**
     * Ajouter un membre à l'équipe
     */
    public function addMember(Request $request, Team $team): JsonResponse
    {
        $validated = $request->validate([
            'employe_id' => 'required|exists:employes,id',
            'joined_at' => 'nullable|date',
        ]);

        $employe = Employe::find($validated['employe_id']);

        // Vérifier que l'employé n'est pas déjà dans l'équipe
        if ($team->hasMember($employe)) {
            return response()->json([
                'message' => 'Cet employé fait déjà partie de l\'équipe',
            ], 422);
        }

        // Vérifier qu'ils sont dans la même company
        if ($employe->company_id !== $team->company_id) {
            return response()->json([
                'message' => 'L\'employé doit appartenir à la même entreprise',
            ], 422);
        }

        $team->addMember($employe, $validated['joined_at'] ?? null);
        $team->load(['members' => function ($query) {
            $query->withPivot('joined_at');
        }]);

        return response()->json([
            'message' => 'Membre ajouté avec succès',
            'team' => $team,
        ]);
    }

    /**
     * Retirer un membre de l'équipe
     */
    public function removeMember(Team $team, Employe $employe): JsonResponse
    {
        if (!$team->hasMember($employe)) {
            return response()->json([
                'message' => 'Cet employé ne fait pas partie de l\'équipe',
            ], 422);
        }

        $team->removeMember($employe);

        return response()->json([
            'message' => 'Membre retiré avec succès',
        ]);
    }

    /**
     * Obtenir la liste des membres d'une équipe
     */
    public function members(Team $team): JsonResponse
    {
        $members = $team->members()
            ->withPivot('joined_at')
            ->orderBy('team_members.joined_at', 'desc')
            ->get();

        return response()->json([
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
                'manager' => $team->manager,
            ],
            'members' => $members->map(function ($member) {
                return [
                    'id' => $member->id,
                    'full_name' => $member->full_name,
                    'job_title' => $member->job_title,
                    'department' => $member->department,
                    'joined_at' => $member->pivot->joined_at,
                ];
            }),
            'total' => $members->count(),
        ]);
    }
}
