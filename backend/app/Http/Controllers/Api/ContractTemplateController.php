<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContractTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ContractTemplateController extends Controller
{
    /**
     * Liste tous les modèles de contrat de l'entreprise
     */
    public function index(Request $request): JsonResponse
    {
        $query = ContractTemplate::where('company_id', auth()->user()->company_id)
            ->select(['id', 'name', 'category', 'description', 'is_active', 'user_id', 'updated_at'])
            ->with('user:id,name');

        if ($request->has('category') && $request->category !== 'tous') {
            $query->where('category', $request->category);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('active_only', false)) {
            $query->where('is_active', true);
        }

        $templates = $query->orderBy('updated_at', 'desc')->get();

        return response()->json($templates);
    }

    /**
     * Créer un nouveau modèle de contrat
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'category'    => 'required|string|in:employe,chantier,prestation,autre',
            'content'     => 'required|array',
            'description' => 'nullable|string|max:500',
            'is_active'   => 'boolean',
        ]);

        try {
            $template = ContractTemplate::create([
                ...$validated,
                'company_id' => auth()->user()->company_id,
                'user_id'    => auth()->id(),
                'is_active'  => $validated['is_active'] ?? true,
            ]);

            $template->load('user:id,name');

            return response()->json($template, 201);
        } catch (\Exception $e) {
            Log::error('Erreur création modèle contrat', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de la création du modèle'], 500);
        }
    }

    /**
     * Afficher un modèle spécifique
     */
    public function show(ContractTemplate $contractTemplate): JsonResponse
    {
        if ($contractTemplate->company_id !== auth()->user()->company_id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        $contractTemplate->load('user:id,name');
        return response()->json($contractTemplate);
    }

    /**
     * Mettre à jour un modèle de contrat
     */
    public function update(Request $request, ContractTemplate $contractTemplate): JsonResponse
    {
        if ($contractTemplate->company_id !== auth()->user()->company_id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'category'    => 'sometimes|string|in:employe,chantier,prestation,autre',
            'content'     => 'sometimes|array',
            'description' => 'nullable|string|max:500',
            'is_active'   => 'boolean',
        ]);

        try {
            $contractTemplate->update($validated);
            $contractTemplate->load('user:id,name');

            return response()->json($contractTemplate);
        } catch (\Exception $e) {
            Log::error('Erreur mise à jour modèle contrat', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de la mise à jour'], 500);
        }
    }

    /**
     * Supprimer un modèle de contrat
     */
    public function destroy(ContractTemplate $contractTemplate): JsonResponse
    {
        if ($contractTemplate->company_id !== auth()->user()->company_id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        try {
            $contractTemplate->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Erreur suppression modèle contrat', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de la suppression'], 500);
        }
    }

    /**
     * Dupliquer un modèle
     */
    public function duplicate(ContractTemplate $contractTemplate): JsonResponse
    {
        if ($contractTemplate->company_id !== auth()->user()->company_id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        try {
            $copy = $contractTemplate->replicate();
            $copy->name = 'Copie de ' . $contractTemplate->name;
            $copy->user_id = auth()->id();
            $copy->save();
            $copy->load('user:id,name');

            return response()->json($copy, 201);
        } catch (\Exception $e) {
            Log::error('Erreur duplication modèle', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de la duplication'], 500);
        }
    }
}
