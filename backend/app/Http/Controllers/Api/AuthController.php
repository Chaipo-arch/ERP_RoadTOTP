<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'company_name' => 'nullable|string|max:255',
        ]);

        // Create Company
        $company = \App\Models\Company::create([
            'name' => $validated['company_name'] ?? ('Entreprise de ' . $validated['name']),
        ]);

        // Create Admin Role
        $role = \App\Models\Role::create([
            'name' => 'Admin',
            'company_id' => $company->id,
        ]);

        // Assign all permissions to Admin
        $permissions = \App\Models\Permission::all();
        $role->permissions()->attach($permissions);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'company_id' => $company->id,
            'role_id' => $role->id,
        ]);

        return response()->json([
            'user' => $user->load(['company', 'userRole.permissions']),
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            // ✅ On ne régénère la session QUE si elle est disponible
            if ($request->hasSession()) {
                $request->session()->regenerate();
            }

            $user = Auth::user();
            return response()->json([
                'user' => $user->load(['company', 'userRole.permissions']),
                'message' => 'Connecté avec succès'
            ]);
        }

        throw ValidationException::withMessages([
            'email' => ['Les identifiants fournis sont incorrects.'],
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        // Supprime la session web si utilisée
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Déconnexion réussie']);
    }


    public function user(Request $request): JsonResponse
    {
        return response()->json(
            $request->user()->load(['company', 'userRole.permissions'])
        );
    }

}
