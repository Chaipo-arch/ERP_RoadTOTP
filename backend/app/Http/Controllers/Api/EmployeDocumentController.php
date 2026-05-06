<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employe;
use App\Models\EmployeDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EmployeDocumentController extends Controller
{
    /**
     * Liste tous les documents d'un employé
     */
    public function index(Employe $employe): JsonResponse
    {
        if ($employe->company_id !== auth()->user()->company_id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        $documents = EmployeDocument::where('employe_id', $employe->id)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($documents);
    }

    /**
     * Créer un document pour un employé
     */
    public function store(Request $request, Employe $employe): JsonResponse
    {
        if ($employe->company_id !== auth()->user()->company_id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'type'    => 'required|string|in:contrat,note,courrier,attestation,autre',
            'content' => 'required|string',
        ]);

        try {
            $document = EmployeDocument::create([
                ...$validated,
                'employe_id' => $employe->id,
                'company_id' => auth()->user()->company_id,
                'user_id'    => auth()->id(),
            ]);

            $document->load('user:id,name');
            return response()->json($document, 201);
        } catch (\Exception $e) {
            Log::error('Erreur création document employé', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de la création'], 500);
        }
    }

    /**
     * Afficher un document spécifique
     */
    public function show(Employe $employe, EmployeDocument $document): JsonResponse
    {
        if ($employe->company_id !== auth()->user()->company_id || $document->employe_id !== $employe->id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        $document->load('user:id,name');
        return response()->json($document);
    }

    /**
     * Mettre à jour un document
     */
    public function update(Request $request, Employe $employe, EmployeDocument $document): JsonResponse
    {
        if ($employe->company_id !== auth()->user()->company_id || $document->employe_id !== $employe->id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        $validated = $request->validate([
            'name'    => 'sometimes|string|max:255',
            'type'    => 'sometimes|string|in:contrat,note,courrier,attestation,autre',
            'content' => 'sometimes|string',
        ]);

        try {
            $document->update($validated);
            $document->load('user:id,name');
            return response()->json($document);
        } catch (\Exception $e) {
            Log::error('Erreur mise à jour document employé', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de la mise à jour'], 500);
        }
    }

    /**
     * Supprimer un document
     */
    public function destroy(Employe $employe, EmployeDocument $document): JsonResponse
    {
        if ($employe->company_id !== auth()->user()->company_id || $document->employe_id !== $employe->id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        try {
            $document->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Erreur suppression document employé', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de la suppression'], 500);
        }
    }
}
