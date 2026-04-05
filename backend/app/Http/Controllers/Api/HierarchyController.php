<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class HierarchyController extends Controller
{
    /**
     * Obtenir l'arbre hiérarchique complet de l'entreprise
     */
    public function tree(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        // Cache pour 1 heure (invalidé lors de modifications d'employés)
        $tree = Cache::remember("hierarchy_tree_{$companyId}", 3600, function () use ($companyId) {
            // Récupérer tous les employés de l'entreprise
            $employes = Employe::where('company_id', $companyId)
                ->with(['subordinates', 'teams'])
                ->get();

            // Trouver les racines (employés sans manager)
            $roots = $employes->where('manager_id', null);

            // Construire l'arbre pour chaque racine
            $tree = $roots->map(function ($root) use ($employes) {
                return $this->buildNode($root, $employes);
            })->values();

            return $tree;
        });

        return response()->json([
            'company_id' => $companyId,
            'tree' => $tree,
        ]);
    }

    /**
     * Obtenir le sous-arbre d'un employé spécifique
     */
    public function subtree(Employe $employe): JsonResponse
    {
        $employes = Employe::where('company_id', $employe->company_id)
            ->with(['subordinates', 'teams'])
            ->get();

        $subtree = $this->buildNode($employe, $employes);

        return response()->json($subtree);
    }

    /**
     * Obtenir les subordonnés directs d'un employé
     */
    public function subordinates(Employe $employe): JsonResponse
    {
        $subordinates = $employe->subordinates()
            ->with(['teams'])
            ->get();

        return response()->json([
            'manager' => [
                'id' => $employe->id,
                'full_name' => $employe->full_name,
                'job_title' => $employe->job_title,
            ],
            'subordinates' => $subordinates->map(function ($sub) {
                return [
                    'id' => $sub->id,
                    'full_name' => $sub->full_name,
                    'job_title' => $sub->job_title,
                    'department' => $sub->department,
                    'status' => $sub->status,
                    'teams' => $sub->teams->pluck('name'),
                    'subordinates_count' => $sub->subordinates()->count(),
                ];
            }),
            'total' => $subordinates->count(),
        ]);
    }

    /**
     * Obtenir le chemin hiérarchique d'un employé jusqu'à la racine
     */
    public function path(Employe $employe): JsonResponse
    {
        $path = $employe->getHierarchyPath();

        return response()->json([
            'employe' => [
                'id' => $employe->id,
                'full_name' => $employe->full_name,
            ],
            'hierarchy_path' => $path->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'full_name' => $emp->full_name,
                    'job_title' => $emp->job_title,
                ];
            }),
            'depth' => $path->count() - 1, // Profondeur dans la hiérarchie
        ]);
    }

    /**
     * Obtenir tous les subordonnés (récursif) d'un employé
     */
    public function allSubordinates(Employe $employe): JsonResponse
    {
        $allSubordinates = $employe->getAllSubordinates();

        return response()->json([
            'manager' => [
                'id' => $employe->id,
                'full_name' => $employe->full_name,
                'job_title' => $employe->job_title,
            ],
            'all_subordinates' => $allSubordinates->map(function ($sub) {
                return [
                    'id' => $sub->id,
                    'full_name' => $sub->full_name,
                    'job_title' => $sub->job_title,
                    'department' => $sub->department,
                    'manager' => [
                        'id' => $sub->manager?->id,
                        'full_name' => $sub->manager?->full_name,
                    ],
                ];
            }),
            'total' => $allSubordinates->count(),
        ]);
    }

    /**
     * Statistiques hiérarchiques de l'entreprise
     */
    public function stats(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $totalEmployes = Employe::where('company_id', $companyId)->count();
        $managers = Employe::where('company_id', $companyId)
            ->whereHas('subordinates')
            ->count();
        
        $roots = Employe::where('company_id', $companyId)
            ->whereNull('manager_id')
            ->count();

        // Profondeur maximale de la hiérarchie
        $maxDepth = $this->calculateMaxDepth($companyId);

        return response()->json([
            'total_employes' => $totalEmployes,
            'total_managers' => $managers,
            'root_positions' => $roots,
            'max_hierarchy_depth' => $maxDepth,
        ]);
    }

    // ---------------- Méthodes Privées ----------------

    /**
     * Construit un nœud de l'arbre récursivement
     */
    private function buildNode(Employe $employe, $allEmployes): array
    {
        $subordinates = $allEmployes->where('manager_id', $employe->id);

        return [
            'id' => $employe->id,
            'full_name' => $employe->full_name,
            'first_name' => $employe->first_name,
            'last_name' => $employe->last_name,
            'job_title' => $employe->job_title,
            'department' => $employe->department,
            'status' => $employe->status,
            'email' => $employe->email,
            'teams' => $employe->teams->map(function ($team) {
                return [
                    'id' => $team->id,
                    'name' => $team->name,
                ];
            }),
            'subordinates_count' => $subordinates->count(),
            'children' => $subordinates->map(function ($sub) use ($allEmployes) {
                return $this->buildNode($sub, $allEmployes);
            })->values()->toArray(),
        ];
    }

    /**
     * Calcule la profondeur maximale de la hiérarchie
     */
    private function calculateMaxDepth(int $companyId): int
    {
        $roots = Employe::where('company_id', $companyId)
            ->whereNull('manager_id')
            ->get();

        $maxDepth = 0;

        foreach ($roots as $root) {
            $depth = $this->getEmployeeDepth($root);
            $maxDepth = max($maxDepth, $depth);
        }

        return $maxDepth;
    }

    /**
     * Calcule la profondeur d'un employé dans la hiérarchie (récursif)
     */
    private function getEmployeeDepth(Employe $employe): int
    {
        $subordinates = $employe->subordinates;

        if ($subordinates->isEmpty()) {
            return 0;
        }

        $maxChildDepth = 0;
        foreach ($subordinates as $subordinate) {
            $depth = $this->getEmployeeDepth($subordinate);
            $maxChildDepth = max($maxChildDepth, $depth);
        }

        return $maxChildDepth + 1;
    }
}
