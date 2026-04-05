<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Clients", description: "Gestion des clients")]
class ClientController extends Controller
{
    #[OA\Get(
        path: "/api/clients",
        summary: "Lister tous les clients",
        description: "Retourne la liste de tous les clients avec le nombre de chantiers associés. Supporte le filtrage par type et la recherche par nom ou contact.",
        tags: ["Clients"],
        parameters: [
            new OA\Parameter(
                name: "type",
                in: "query",
                required: false,
                description: "Filtrer par type de client",
                schema: new OA\Schema(type: "string", enum: ["Public", "Privé"])
            ),
            new OA\Parameter(
                name: "search",
                in: "query",
                required: false,
                description: "Rechercher par nom du client ou nom du contact",
                schema: new OA\Schema(type: "string")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Liste des clients récupérée avec succès",
                content: new OA\JsonContent(
                    type: "array",
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: "id", type: "integer", example: 1),
                            new OA\Property(property: "name", type: "string", example: "Bouygues Construction"),
                            new OA\Property(property: "type", type: "string", enum: ["Public", "Privé"], example: "Privé"),
                            new OA\Property(property: "contact_name", type: "string", example: "Jean Dupont"),
                            new OA\Property(property: "email", type: "string", format: "email", example: "jean.dupont@bouygues.fr"),
                            new OA\Property(property: "phone", type: "string", example: "01 23 45 67 89"),
                            new OA\Property(property: "address", type: "string", nullable: true, example: "1 avenue Eugène Freyssinet, 78280 Guyancourt"),
                            new OA\Property(property: "siret", type: "string", nullable: true, example: "57201524200065"),
                            new OA\Property(property: "notes", type: "string", nullable: true, example: "Client fidèle depuis 2020"),
                            new OA\Property(property: "company_id", type: "integer", example: 1),
                            new OA\Property(property: "chantiers_count", type: "integer", example: 5),
                            new OA\Property(property: "active_chantiers_count", type: "integer", example: 2),
                            new OA\Property(property: "created_at", type: "string", format: "date-time"),
                            new OA\Property(property: "updated_at", type: "string", format: "date-time"),
                        ]
                    )
                )
            )
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $query = Client::withCount(['chantiers', 'chantiers as active_chantiers_count' => function ($q) {
            $q->whereIn('status', ['En cours', 'Planifié']);
        }]);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_name', 'like', "%{$search}%");
            });
        }

        return response()->json($query->get());
    }

    #[OA\Post(
        path: "/api/clients",
        summary: "Créer un nouveau client",
        description: "Crée un nouveau client avec les informations fournies.",
        tags: ["Clients"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["name", "type", "contact_name", "email", "phone"],
                properties: [
                    new OA\Property(property: "name", type: "string", example: "Vinci Construction", description: "Nom du client ou de l'entreprise"),
                    new OA\Property(property: "type", type: "string", enum: ["Public", "Privé"], example: "Privé", description: "Type de client"),
                    new OA\Property(property: "contact_name", type: "string", example: "Marie Martin", description: "Nom du contact principal"),
                    new OA\Property(property: "email", type: "string", format: "email", example: "marie.martin@vinci.fr", description: "Email du contact"),
                    new OA\Property(property: "phone", type: "string", example: "01 98 76 54 32", description: "Téléphone du contact"),
                    new OA\Property(property: "address", type: "string", nullable: true, example: "5 cours Ferdinand de Lesseps, 92851 Rueil-Malmaison", description: "Adresse postale"),
                    new OA\Property(property: "siret", type: "string", nullable: true, maxLength: 14, example: "55207029800035", description: "Numéro SIRET (14 caractères max)"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Client créé avec succès",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "id", type: "integer", example: 1),
                        new OA\Property(property: "name", type: "string", example: "Vinci Construction"),
                        new OA\Property(property: "type", type: "string", example: "Privé"),
                        new OA\Property(property: "contact_name", type: "string", example: "Marie Martin"),
                        new OA\Property(property: "email", type: "string", example: "marie.martin@vinci.fr"),
                        new OA\Property(property: "phone", type: "string", example: "01 98 76 54 32"),
                        new OA\Property(property: "address", type: "string", nullable: true, example: "5 cours Ferdinand de Lesseps, 92851 Rueil-Malmaison"),
                        new OA\Property(property: "siret", type: "string", nullable: true, example: "55207029800035"),
                        new OA\Property(property: "company_id", type: "integer", example: 1),
                        new OA\Property(property: "created_at", type: "string", format: "date-time"),
                        new OA\Property(property: "updated_at", type: "string", format: "date-time"),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: "Erreur de validation",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "The given data was invalid."),
                        new OA\Property(
                            property: "errors",
                            type: "object",
                            example: ["name" => ["The name field is required."]]
                        ),
                    ]
                )
            )
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:Public,Privé',
            'contact_name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string',
            'address' => 'nullable|string',
            'siret' => 'nullable|string|max:14',
        ]);

        $client = Client::create($validated);

        return response()->json($client, 201);
    }

    #[OA\Get(
        path: "/api/clients/{id}",
        summary: "Afficher un client",
        description: "Retourne les détails d'un client spécifique avec ses chantiers associés.",
        tags: ["Clients"],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID du client",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Détails du client",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "id", type: "integer", example: 1),
                        new OA\Property(property: "name", type: "string", example: "Bouygues Construction"),
                        new OA\Property(property: "type", type: "string", example: "Privé"),
                        new OA\Property(property: "contact_name", type: "string", example: "Jean Dupont"),
                        new OA\Property(property: "email", type: "string", example: "jean.dupont@bouygues.fr"),
                        new OA\Property(property: "phone", type: "string", example: "01 23 45 67 89"),
                        new OA\Property(property: "address", type: "string", nullable: true),
                        new OA\Property(property: "siret", type: "string", nullable: true),
                        new OA\Property(property: "company_id", type: "integer", example: 1),
                        new OA\Property(
                            property: "chantiers",
                            type: "array",
                            description: "Liste des chantiers du client",
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: "id", type: "integer", example: 1),
                                    new OA\Property(property: "name", type: "string", example: "Construction Pont A15"),
                                    new OA\Property(property: "status", type: "string", example: "En cours"),
                                    new OA\Property(property: "budget", type: "number", format: "float", example: 150000.00),
                                ]
                            )
                        ),
                        new OA\Property(property: "created_at", type: "string", format: "date-time"),
                        new OA\Property(property: "updated_at", type: "string", format: "date-time"),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: "Client non trouvé",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "No query results for model [App\\Models\\Client] 999")
                    ]
                )
            )
        ]
    )]
    public function show(Client $client): JsonResponse
    {
        return response()->json($client->load('chantiers'));
    }

    #[OA\Put(
        path: "/api/clients/{id}",
        summary: "Mettre à jour un client",
        description: "Met à jour les informations d'un client existant. Seuls les champs fournis seront mis à jour.",
        tags: ["Clients"],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID du client",
                schema: new OA\Schema(type: "integer")
            )
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "name", type: "string", example: "Bouygues Construction SAS", description: "Nom du client"),
                    new OA\Property(property: "type", type: "string", enum: ["Public", "Privé"], example: "Privé", description: "Type de client"),
                    new OA\Property(property: "contact_name", type: "string", example: "Jean Dupont", description: "Nom du contact"),
                    new OA\Property(property: "email", type: "string", format: "email", example: "jean.dupont@bouygues.fr", description: "Email du contact"),
                    new OA\Property(property: "phone", type: "string", example: "01 23 45 67 89", description: "Téléphone"),
                    new OA\Property(property: "address", type: "string", nullable: true, example: "1 avenue Eugène Freyssinet, 78280 Guyancourt", description: "Adresse postale"),
                    new OA\Property(property: "siret", type: "string", nullable: true, maxLength: 14, example: "57201524200065", description: "Numéro SIRET"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Client mis à jour avec succès",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "id", type: "integer", example: 1),
                        new OA\Property(property: "name", type: "string", example: "Bouygues Construction SAS"),
                        new OA\Property(property: "type", type: "string", example: "Privé"),
                        new OA\Property(property: "contact_name", type: "string", example: "Jean Dupont"),
                        new OA\Property(property: "email", type: "string", example: "jean.dupont@bouygues.fr"),
                        new OA\Property(property: "phone", type: "string", example: "01 23 45 67 89"),
                        new OA\Property(property: "address", type: "string", nullable: true),
                        new OA\Property(property: "siret", type: "string", nullable: true),
                        new OA\Property(property: "company_id", type: "integer", example: 1),
                        new OA\Property(property: "created_at", type: "string", format: "date-time"),
                        new OA\Property(property: "updated_at", type: "string", format: "date-time"),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: "Client non trouvé"
            ),
            new OA\Response(
                response: 422,
                description: "Erreur de validation"
            )
        ]
    )]
    public function update(Request $request, Client $client): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:Public,Privé',
            'contact_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email',
            'phone' => 'sometimes|string',
            'address' => 'nullable|string',
            'siret' => 'nullable|string|max:14',
        ]);

        $client->update($validated);

        return response()->json($client);
    }

    #[OA\Delete(
        path: "/api/clients/{id}",
        summary: "Supprimer un client",
        description: "Supprime un client de la base de données.",
        tags: ["Clients"],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID du client à supprimer",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 204,
                description: "Client supprimé avec succès"
            ),
            new OA\Response(
                response: 404,
                description: "Client non trouvé"
            )
        ]
    )]
    public function destroy(Client $client): JsonResponse
    {
        $client->delete();
        return response()->json(null, 204);
    }

    #[OA\Get(
        path: "/api/clients/{id}/chantiers",
        summary: "Lister les chantiers d'un client",
        description: "Retourne la liste de tous les chantiers associés à un client spécifique.",
        tags: ["Clients"],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID du client",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Liste des chantiers du client",
                content: new OA\JsonContent(
                    type: "array",
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: "id", type: "integer", example: 1),
                            new OA\Property(property: "name", type: "string", example: "Construction Pont A15"),
                            new OA\Property(property: "status", type: "string", example: "En cours"),
                            new OA\Property(property: "budget", type: "number", format: "float", example: 150000.00),
                            new OA\Property(property: "start_date", type: "string", format: "date", example: "2026-01-15"),
                            new OA\Property(property: "end_date", type: "string", format: "date", nullable: true, example: "2026-06-30"),
                            new OA\Property(property: "created_at", type: "string", format: "date-time"),
                            new OA\Property(property: "updated_at", type: "string", format: "date-time"),
                        ]
                    )
                )
            ),
            new OA\Response(
                response: 404,
                description: "Client non trouvé"
            )
        ]
    )]
    public function chantiers(Client $client): JsonResponse
    {
        return response()->json($client->chantiers);
    }
}
