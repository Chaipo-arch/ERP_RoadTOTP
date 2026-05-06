<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employe;

use App\Models\Contrats;
use App\Models\EmployesContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ContratController extends Controller
{
    /**
     * Liste tous les types de contrats disponibles
     */
    public function types(): JsonResponse
    {
        $types = Contrats::all();
        return response()->json($types);
    }

    /**
     * Liste les contrats d'un employé spécifique
     */
    public function index(Employe $employe): JsonResponse
    {
        // Vérification que l'employé appartient à la même entreprise
        if ($employe->company_id !== auth()->user()->company_id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        $contrats = EmployesContract::where('employe_id', $employe->id)
            ->with(['contratType', 'documents'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($contrats);
    }

    /**
     * Créer un nouveau contrat pour un employé
     */
    public function store(Request $request, Employe $employe): JsonResponse
    {
        if ($employe->company_id !== auth()->user()->company_id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        $validated = $request->validate([
            'contrat_id' => 'required|exists:contrats,id',
            'job_title' => 'required|string|max:255',
            'hourly_salary' => 'nullable|numeric|min:0',
            'hourly_rate' => 'nullable|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'required|in:Actif,Suspendu,Terminé,Résilié',
            'notes' => 'nullable|string',
        ]);

        try {
            $contrat = EmployesContract::create([
                'employe_id' => $employe->id,
                'contrat_id' => $validated['contrat_id'],
                'job_title' => $validated['job_title'],
                'hourly_salary' => $validated['hourly_salary'] ?? 0,
                'hourly_rate' => $validated['hourly_rate'] ?? null,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'] ?? null,
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Charger les relations pour la réponse
            $contrat->load(['contratType', 'documents']);

            return response()->json($contrat, 201);
        } catch (\Exception $e) {
            Log::error('Erreur création contrat', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de la création du contrat'], 500);
        }
    }

    /**
     * Afficher un contrat spécifique
     */
    public function show(Employe $employe, EmployesContract $contrat): JsonResponse
    {
        if ($employe->company_id !== auth()->user()->company_id || $contrat->employe_id !== $employe->id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        $contrat->load(['contratType', 'documents', 'employe']);
        return response()->json($contrat);
    }

    /**
     * Mettre à jour un contrat
     */
    public function update(Request $request, Employe $employe, EmployesContract $contrat): JsonResponse
    {
        if ($employe->company_id !== auth()->user()->company_id || $contrat->employe_id !== $employe->id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        $validated = $request->validate([
            'contrat_id' => 'sometimes|exists:contrats,id',
            'job_title' => 'sometimes|string|max:255',
            'hourly_salary' => 'nullable|numeric|min:0',
            'hourly_rate' => 'nullable|numeric|min:0',
            'start_date' => 'sometimes|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'sometimes|in:Actif,Suspendu,Terminé,Résilié',
            'notes' => 'nullable|string',
        ]);

        try {
            $contrat->update(array_filter($validated, fn($v) => $v !== null));
            $contrat->load(['contratType', 'documents']);

            return response()->json($contrat);
        } catch (\Exception $e) {
            Log::error('Erreur mise à jour contrat', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de la mise à jour'], 500);
        }
    }

    /**
     * Supprimer un contrat
     */
    public function destroy(Employe $employe, EmployesContract $contrat): JsonResponse
    {
        if ($employe->company_id !== auth()->user()->company_id || $contrat->employe_id !== $employe->id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        try {
            // Supprimer les documents associés d'abord
            foreach ($contrat->documents as $doc) {
                if (Storage::disk('public')->exists($doc->file_path)) {
                    Storage::disk('public')->delete($doc->file_path);
                }
                $doc->delete();
            }

            $contrat->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Erreur suppression contrat', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de la suppression'], 500);
        }
    }

    /**
     * Upload d'un document lié à un contrat (assurance, avenant, etc.)
     */
    public function uploadDocument(Request $request, Employe $employe, EmployesContract $contrat): JsonResponse
    {
        if ($employe->company_id !== auth()->user()->company_id || $contrat->employe_id !== $employe->id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'type' => 'required|string|in:contrat,assurance,avenant,attestation,autre',
            'name' => 'nullable|string|max:255',
        ]);

        try {
            $file = $request->file('file');
            $fileName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) 
                . '-' . time() . '.' . $file->getClientOriginalExtension();
            
            $path = $file->storeAs('contrats/documents', $fileName, 'public');

            $document = $contrat->documents()->create([
                'name' => $request->input('name', $file->getClientOriginalName()),
                'file_path' => $path,
                'type' => $request->input('type', 'autre'),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'user_id' => auth()->id(),
                'company_id' => auth()->user()->company_id,
            ]);

            return response()->json($document, 201);
        } catch (\Exception $e) {
            Log::error('Erreur upload document contrat', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de l\'upload'], 500);
        }
    }

    /**
     * Supprimer un document lié à un contrat
     */
    public function deleteDocument(Employe $employe, EmployesContract $contrat, $documentId): JsonResponse
    {
        if ($employe->company_id !== auth()->user()->company_id || $contrat->employe_id !== $employe->id) {
            return response()->json(['error' => 'Action non autorisée.'], 403);
        }

        $document = $contrat->documents()->find($documentId);
        if (!$document) {
            return response()->json(['error' => 'Document non trouvé'], 404);
        }

        if (Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }
        $document->delete();

        return response()->json(null, 204);
    }
}
