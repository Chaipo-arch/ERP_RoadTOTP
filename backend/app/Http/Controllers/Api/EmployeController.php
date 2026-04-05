<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employe;
use App\Models\User;
use App\Models\EmployeContrats;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // 1. Get the authenticated user's company_id
        $userCompanyId = auth()->user()->company_id;
        // 2. Start the query scoped to that company
        $query = Employe::where('company_id', $userCompanyId);
        
        if ($request->has('department')) {
            $query->where('department', $request->department);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }
        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            // Données de l'employé
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:employes,email',
            'phone' => 'required|string',
            'job_title' => 'required|string',
            'department' => 'nullable|string',
            'hire_date' => 'required|date',
            'status' => 'required|in:Actif,Congé,Formation,Inactif',
            'manager_id' => 'nullable|exists:employes,id',
            'user_id' => 'nullable|exists:users,id',
            
            // Données du contrat
            'contrat_id' => 'required|integer', // ID du type de contrat (CDI, CDD...)
            'hourly_salary' => 'nullable|numeric|min:0',
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                // 1. Création de l'employé
                $employe = Employe::create([
                    'company_id' => auth()->user()->company_id,
                    'first_name' => $validated['first_name'],
                    'last_name' => $validated['last_name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'],
                    'job_title' => $validated['job_title'],
                    'department' => $validated['department'],
                    'status' => $validated['status'],
                    'manager_id' => $validated['manager_id'],
                    'user_id' => $validated['user_id'],
                ]);

                // 2. Création du contrat lié
                // Note : Vérifie que le nom de la relation dans Employe.php correspond bien à EmployesContract
                $employe->contracts()->create([
                    'contrat_id' => $validated['contrat_id'],
                    'job_title' => $validated['job_title'],
                    'hourly_salary' => $validated['hourly_salary'] ?? 0,
                    'start_date' => $validated['hire_date'], // On utilise la date d'embauche
                    'status' => 'Actif'
                ]);

                return response()->json($employe->load('contracts'), 201);
            });
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erreur lors de la création : ' . $e->getMessage()], 500);
        }
    }

    public function show(Employe $employe): JsonResponse
    {
        $employe = DB::table('employes')
        // On joint la table des contrats sur l'ID de l'employé
        ->leftJoin('employes_contract', function($join) {
            $join->on('employes.id', '=', 'employes_contract.employe_id');
        })
        // On sélectionne tout de l'employé + les colonnes spécifiques du contrat
        ->select(
            'employes.*', 
            'employes_contract.contrat_id', 
            'employes_contract.hourly_salary'
        )
        ->where('employes.id', $employe->id)
        ->where('employes.company_id', auth()->user()->company_id)
        ->first();

        if (!$employe) {
            return response()->json(['error' => 'Employé non trouvé'], 404);
        }

        return response()->json($employe);
    }

    public function update(Request $request, Employe $employe): JsonResponse
    {
        // Security check to ensure the user belongs to the same company
        if ($employe->company_id !== auth()->user()->company_id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        $validated = $request->validate([
            // Données de l'employé (using 'sometimes' so we can update partially)
            'first_name'    => 'sometimes|string|max:255',
            'last_name'     => 'sometimes|string|max:255',
            'email'         => 'sometimes|email|unique:employes,email,' . $employe->id,
            'phone'         => 'sometimes|string',
            'job_title'     => 'sometimes|string',
            'department'    => 'sometimes|string',
            'hire_date'     => 'sometimes|date',
            'status'        => 'sometimes|in:Actif,Congé,Formation,Inactif',
            'manager_id'    => 'nullable|exists:employes,id',
            'user_id'       => 'nullable|exists:users,id',
            
            // Données du contrat
            'contrat_id'    => 'sometimes|integer',
            'hourly_salary' => 'sometimes|numeric|min:0',
        ]);

        try {
            return DB::transaction(function () use ($validated, $employe) {
                // 1. Mise à jour de l'employé
                $employe->update([
                    'first_name' => $validated['first_name'],
                    'last_name' => $validated['last_name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'],
                    'job_title' => $validated['job_title'],
                    'department' => $validated['department'],
                    'status' => $validated['status'],
                    'manager_id' => $validated['manager_id'],
                    'user_id' => $validated['user_id'],
                    'company_id' => auth()->user()->company_id
                ]);
                
                // 2. Mise à jour ou création du contrat (exactement comme le store)
                // On met à jour le contrat "Actif" existant
                $employe->contracts()->where('employe_id', $employe->id)->update(array_filter([
                    'contrat_id'    => $validated['contrat_id'] ?? null,
                    'job_title'     => $validated['job_title'] ?? null,
                    'hourly_salary' => $validated['hourly_salary'] ?? null,
                    'start_date'    => $validated['hire_date'] ?? null,
                ]));

                return response()->json($employe->load('contracts'));
            });
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erreur lors de la mise à jour : ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Employe $employe): JsonResponse
    {
        $employe->delete();
        return response()->json(null, 204);
    }

    public function updateStatus(Request $request, Employe $employe): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:Actif,Congé,Formation,Inactif',
        ]);

        $employe->update($validated);

        return response()->json($employe);
    }

    public function assignments(Employe $employe): JsonResponse
    {
        return response()->json($employe->chantiers);
    }

    public function getEmployeByUserId(){
        $query = Employe::query();
        $query->where('user_id', auth()->id());
        return response()->json($query->first());
    }

    public function availableUsers(): JsonResponse
    {
        // tous les users qui n'ont pas encore de ligne dans employes

        $users = User::whereDoesntHave('employe')->get();
       
        return response()->json($users);
    }
}
