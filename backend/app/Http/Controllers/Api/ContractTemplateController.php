<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContractTemplate;
use App\Models\Document; // <--- 💡 CORRECTION 1 : Import indispensable pour la GED (il manquait !)
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ContractTemplateController extends Controller
{
    /**
     * Liste tous les modèles de contrat de l'entreprise
     */
    public function index(Request $request): JsonResponse
    {
        $query = ContractTemplate::where('company_id', auth()->user()->company_id)
            ->select()
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

    // --- CRÉATION ---
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'description' => 'nullable|string',
            'file' => 'nullable|file',
        ]);

        try {
            // 1. Création du modèle de contrat d'abord (pour obtenir son ID)
            $template = ContractTemplate::create([
                'name' => $request->name,
                'category' => $request->category,
                'description' => $request->description ?? '',
                'user_id' => auth()->id(),
                'company_id' => auth()->user()->company_id,
                'is_active' => true,
            ]);

            // 2. Si OnlyOffice envoie un fichier, on délègue tout au DocumentController
            if ($request->hasFile('file')) {
                // Création d'une requête interne simulée contenant les champs requis par ton DocumentController
                $documentRequest = new Request();
                $documentRequest->setMethod('POST');
                
                // On injecte les fichiers et les paramètres indispensables
                $documentRequest->files->set('file', $request->file('file'));
                $documentRequest->merge([
                    'model_type'        => 'contract_template', // Requis par getModelClass() de DocumentController
                    'model_id'          => $template->id,
                    'documentable_type' => ContractTemplate::class, // Secours pour la structure de table
                    'documentable_id'   => $template->id,
                    'type'              => 'template'
                ]);

                // On associe l'utilisateur connecté à cette sous-requête
                $documentRequest->setUserResolver(fn () => auth()->user());

                // 🚀 APPEL DIRECT DE LA MÉTHODE STORE DE TON DOCUMENT CONTROLLER
                $documentController = app(DocumentController::class);
                $documentResponse = $documentController->store($documentRequest);

                if ($documentResponse->getStatusCode() === 201) {
                    $documentData = $documentResponse->getData();
                    
                    // Récupération du chemin/id créé par la GED pour l'associer au template
                    $template->update([
                        'document_id' => $documentData->id,
                        // Utilise l'URL du fichier généré par la GED
                        'docUrl'      => asset('storage/' . $documentData->file_path) 
                    ]);
                } else {
                    Log::error('Le DocumentController a échoué à enregistrer le fichier', [(array)$documentResponse->getData()]);
                }
            }

            return response()->json($template, 201);
        } catch (\Exception $e) {
            Log::error('Erreur Store Template:', ['msg' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de la création'], 500);
        }
    }

    // --- MISE À JOUR ---
    public function update(Request $request, $id): JsonResponse
    {
        $template = ContractTemplate::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'description' => 'nullable|string',
            'file' => 'nullable|file',
        ]);

        try {
            $template->update([
                'name' => $request->name,
                'category' => $request->category,
                'description' => $request->description ?? '',
            ]);

            if ($request->hasFile('file')) {
                // Même logique pour la mise à jour : on passe par DocumentController
                $documentRequest = new Request();
                $documentRequest->setMethod('POST');
                $documentRequest->files->set('file', $request->file('file'));
                $documentRequest->merge([
                    'model_type'        => 'contract_template', // Requis par getModelClass() de DocumentController
                    'model_id'          => $template->id,
                    'documentable_type' => ContractTemplate::class, // Secours pour la structure de table
                    'documentable_id'   => $template->id,
                    'type'              => 'template'
                ]);
                $documentRequest->setUserResolver(fn () => auth()->user());

                $documentResponse = app(DocumentController::class)->store($documentRequest);

                if ($documentResponse->getStatusCode() === 201) {
                    $documentData = $documentResponse->getData();
                    $template->update([
                        'document_id' => $documentData->id,
                        'docUrl'      => asset('storage/' . $documentData->file_path)
                    ]);
                }
            }

            return response()->json($template);
        } catch (\Exception $e) {
            Log::error('Erreur Update Template:', ['msg' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de la mise à jour'], 500);
        }
    }


    /**
     * Callback OnlyOffice
     */
    public function onlyOfficeCallback(Request $request): JsonResponse
    {
        return response()->json(['error' => 0]);
    }
}