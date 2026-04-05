<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chantier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Info(
    title: "ERP RoadToTP API",
    version: "1.0.0"
)]
#[OA\Server(
    url: "http://localhost:8000",
    description: "Serveur Local"
)]
class ChantierController extends Controller
{
    #[OA\Get(
        path: "/api/chantiers",
        summary: "Lister les chantiers",
        tags: ["Chantier"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Liste des chantiers"
            )
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $query = Chantier::with('client');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%");
            });
        }

        $chantiers = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($chantiers);
    }

    #[OA\Post(
        path: "/api/chantiers",
        summary: "Créer un chantier",
        tags: ["Chantier"],
        requestBody:new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["name", "client_id", "location", "start_date", "end_date", "budget", "status"],
                properties: [
                    new OA\Property(
                        property: "name",
                        type: "string",
                        example: "Chantier 1"
                    ),
                    new OA\Property(
                        property: "description",
                        type: "string",
                        example: "Description du chantier"
                    ),
                    new OA\Property(
                        property: "client_id",
                        type: "integer",
                        example: 1
                    ),
                    new OA\Property(
                        property: "location",
                        type: "string",
                        example: "Location du chantier"
                    ),
                    new OA\Property(
                        property: "address",
                        type: "string",
                        example: "Adresse du chantier"
                    ),
                    new OA\Property(
                        property: "start_date",
                        type: "string",
                        example: "2022-01-01"
                    ),
                    new OA\Property(
                        property: "end_date",
                        type: "string",
                        example: "2022-01-01"
                    ),
                    new OA\Property(
                        property: "budget",
                        type: "number",
                        example: 1000000
                    ),
                    new OA\Property(
                        property: "status",
                        type: "string",
                        example: "Planifié"
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Chantier créé"
            )
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'client_id' => 'required|exists:clients,id',
            'location' => 'required|string',
            'address' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'budget' => 'required|numeric|min:0',
            'status' => 'required|in:Planifié,En cours,Terminé,Suspendu',
        ]);

        $validated['reference'] = Chantier::generateReference();
        $validated['progress'] = 0;

        $chantier = Chantier::create($validated);

        return response()->json($chantier->load('client'), 201);
    }

    #[OA\Get(
        path: "/api/chantiers/{id}",
        summary: "Récupère les détails d'un chantier",
        tags: ["Chantier"],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID du chantier",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Détails du chantier"
            )
        ]
    )]
    public function show(Chantier $chantier): JsonResponse
    {
        return response()->json($chantier->load(['client', 'employes', 'materiels']));
    }

    public function update(Request $request, Chantier $chantier): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'client_id' => 'sometimes|exists:clients,id',
            'location' => 'sometimes|string',
            'address' => 'nullable|string',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after:start_date',
            'budget' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|in:Planifié,En cours,Terminé,Suspendu',
            'progress' => 'sometimes|integer|min:0|max:100',
        ]);

        $chantier->update($validated);

        return response()->json($chantier->load('client'));
    }

    #[OA\Delete(
        path: "/api/chantiers/{id}",
        summary: "Supprime un chantier",
        tags: ["Chantier"],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID du chantier",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 204,
                description: "Chantier supprimé"
            )
        ]
    )]
    public function destroy(Chantier $chantier): JsonResponse
    {
        $chantier->delete();
        return response()->json(null, 204);
    }

    public function updateProgress(Request $request, Chantier $chantier): JsonResponse
    {
        $validated = $request->validate([
            'progress' => 'required|integer|min:0|max:100',
        ]);

        $chantier->update($validated);

        if ($validated['progress'] === 100) {
            $chantier->update(['status' => 'Terminé']);
        }

        return response()->json($chantier);
    }

    public function getTeam(Chantier $chantier): JsonResponse
    {
        return response()->json($chantier->employes);
    }

    public function assignTeam(Request $request, Chantier $chantier): JsonResponse
    {
        $validated = $request->validate([
            'employe_ids' => 'required|array',
            'employe_ids.*' => 'exists:employes,id',
        ]);

        $chantier->employes()->sync($validated['employe_ids']);

        return response()->json($chantier->load('employes'));
    }
}
