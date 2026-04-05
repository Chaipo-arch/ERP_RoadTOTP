<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleController extends Controller
{
    public function index()
    {
        // Only return roles for the user's company
        $roles = Role::where('company_id', Auth::user()->company_id)
                     ->with('permissions')
                     ->get();
        return response()->json($roles);
    }

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

        if (isset($validated['permissions'])) {
            $role->permissions()->sync($validated['permissions']);
        }

        return response()->json($role->load('permissions'), 201);
    }

    public function show(Role $role)
    {
        if ($role->company_id !== Auth::user()->company_id) {
            abort(403, 'Unauthorized access to this role');
        }

        return response()->json($role->load('permissions'));
    }

    public function update(Request $request, Role $role)
    {
        if ($role->company_id !== Auth::user()->company_id) {
            abort(403);
        }
        
        $validated = $request->validate([
            'name' => 'string|max:255',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        if (isset($validated['name'])) {
            $role->update(['name' => $validated['name']]);
        }

        if (isset($validated['permissions'])) {
            $role->permissions()->sync($validated['permissions']);
        }

        return response()->json($role->load('permissions'));
    }

    public function destroy(Role $role)
    {
         if ($role->company_id !== Auth::user()->company_id) {
            abort(403);
        }
        
        if (Auth::user()->role_id === $role->id) {
             return response()->json(['message' => 'Cannot delete your own role'], 400);
        }

        $role->delete();
        return response()->json(null, 204);
    }
}
