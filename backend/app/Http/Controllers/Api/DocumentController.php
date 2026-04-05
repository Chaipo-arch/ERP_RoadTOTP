<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class DocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Log::info('DocumentController@index', [
            'company_id' => auth()->user()->company_id,
            'user_id' => auth()->user()->id,
        ]);
        // On récupère uniquement les documents de la société de l'utilisateur connecté
        $documents = Document::where('company_id', auth()->user()->company_id)
            ->with('uploader') // On garde l'uploader pour savoir qui a déposé le fichier
            ->latest()
            ->get();

        return response()->json($documents);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240', // Max 10MB
            'model_type' => 'required|string',
            'model_id' => 'required|integer',
            'type' => 'required|string',
        ]);

        $file = $request->file('file');
        $fileName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '-' . time() . '.' . $file->getClientOriginalExtension();
        
        // Stockage dans le dossier 'documents' du disque public
        $path = $file->storeAs('documents', $fileName, 'public');

        $modelClass = $this->getModelClass($request->model_type);
        if (!$modelClass) {
            return response()->json(['error' => 'Type de modèle invalide'], 400);
        }

        $document = new Document([
            'name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'type' => $request->type,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'user_id' => $request->user()->id,
            'company_id' => auth()->user()->company_id
        ]);

        $model = $modelClass::find($request->model_id);
        if (!$model) {
             return response()->json(['error' => 'Entité introuvable'], 404);
        }

        $model->documents()->save($document);

        return response()->json($document, 201);
    }

    public function download(Document $document)
    {
        // Vérification des droits d'accès si nécessaire ici
        if (Storage::disk('public')->exists($document->file_path)) {
            return Storage::disk('public')->download($document->file_path, $document->name);
        }
        return response()->json(['error' => 'Fichier introuvable'], 404);
    }

    public function destroy(Document $document): JsonResponse
    {
        // Supprimer le fichier physique
        if (Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();
        return response()->json(null, 204);
    }

    private function getModelClass($type)
    {
        $map = [
            'chantier' => \App\Models\Chantier::class,
            'client' => \App\Models\Client::class,
            'employe' => \App\Models\Employe::class,
            'materiel' => \App\Models\Materiel::class,
        ];
        return $map[strtolower($type)] ?? null;
    }
}
