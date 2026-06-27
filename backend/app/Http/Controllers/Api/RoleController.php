<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleController extends Controller
{
    // Liste des rôles de l'entreprise
    public function index()
    {
        return Role::where('company_id', Auth::user()->company_id)
            ->with('permissions')
            ->withCount('users') // Compte le nombre d'utilisateurs par rôle
            ->get();
    }

    // Création d'un rôle
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'company_id' => Auth::user()->company_id,
        ]);

        if (!empty($validated['permissions'])) {
            $role->permissions()->sync($validated['permissions']);
        }

        return response()->json($role->load('permissions'), 201);
    }

    // Mise à jour d'un rôle
    public function update(Request $request, Role $role)
    {
        if ($role->company_id !== Auth::user()->company_id) abort(403);
        
        $validated = $request->validate([
            'name' => 'string|max:255',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        if (isset($validated['name'])) $role->update(['name' => $validated['name']]);
        if (isset($validated['permissions'])) $role->permissions()->sync($validated['permissions']);

        return response()->json($role->load('permissions'));
    }

    // --- NOUVELLES MÉTHODES POUR L'INTERFACE UTILISATEURS ---
    public function show(Role $role)
    {
        // Sécurité : vérifier que le rôle appartient à l'entreprise de l'utilisateur
        if ($role->company_id !== Auth::user()->company_id) {
            abort(403, 'Action non autorisée pour cette entreprise.');
        }

        return response()->json($role->load('permissions'));
    }
    // Récupère tous les utilisateurs de l'entreprise pour affectation
    public function users()
    {
        return User::where('company_id', Auth::user()->company_id)
            ->with('userRole')
            ->get();
    }

    // Modifie le rôle d'un utilisateur spécifique
    public function updateUserRole(Request $request, User $user)
    {
        // Sécurité : l'utilisateur doit être dans la même entreprise
        if ($user->company_id !== Auth::user()->company_id) abort(403);

        $validated = $request->validate([
            'role_id' => 'nullable|exists:roles,id'
        ]);

        $user->update(['role_id' => $validated['role_id']]);

        return response()->json(['message' => 'Rôle mis à jour avec succès']);
    }

    public function destroy(Role $role)
    {
        if ($role->company_id !== Auth::user()->company_id) abort(403);
        $role->delete();
        return response()->json(null, 204);
    }
}