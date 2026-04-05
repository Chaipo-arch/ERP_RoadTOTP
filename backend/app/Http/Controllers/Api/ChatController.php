<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Conversation;
use App\Models\Message;
use OpenApi\Attributes as OA;

class ChatController extends Controller
{
    #[OA\Get(
        path: "/api/conversations",
        summary: "Lister les conversations",
        tags: ["Chat"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Liste des conversations"
            )
        ]
    )]
    public function index(Request $request)
    {
        $conversations = $request->user()->conversations()
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($conversations);
    }

    #[OA\Get(
        path: "/api/conversations/{id}",
        summary: "Récupère les messages d'une conversation spécifique",
        tags: ["Chat"],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID de la conversation",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Historique des messages"
            )
        ]
    )]
    public function show($id, Request $request)
    {
        $conversation = $request->user()->conversations()->findOrFail($id);

        return response()->json(
            $conversation->messages()->orderBy('created_at', 'asc')->get()
        );
    }

    #[OA\Delete(
        path: "/api/conversations/{id}",
        summary: "Supprimer une conversation",
        tags: ["Chat"],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Conversation supprimée"
            )
        ]
    )]
    public function destroy($id, Request $request)
    {
        $conversation = $request->user()->conversations()->findOrFail($id);
        $conversation->delete();

        return response()->json([
            'message' => 'Conversation deleted'
        ]);
    }

    #[OA\Post(
        path: "/api/chat",
        summary: "Envoyer un message à l'agent IA",
        tags: ["Chat"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["message"],
                properties: [
                    new OA\Property(
                        property: "message",
                        type: "string",
                        example: "Bonjour, quels sont mes clients ?"
                    ),
                    new OA\Property(
                        property: "conversation_id",
                        type: "integer",
                        nullable: true,
                        example: 1
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Réponse de l'agent IA"
            )
        ]
    )]
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'conversation_id' => 'nullable|exists:conversations,id'
        ]);

        $user = $request->user();
        $userMessageContent = $request->input('message');
        $conversationId = $request->input('conversation_id');

        if ($conversationId) {
            $conversation = $user->conversations()->findOrFail($conversationId);
        } else {
            $conversation = $user->conversations()->create([
                'title' => substr($userMessageContent, 0, 50) . '...',
                'company_id' => $user->company_id
            ]);
        }

        $conversation->messages()->create([
            'role' => 'user',
            'content' => $userMessageContent,
            'company_id' => $user->company_id
        ]);

        $response = $this->queryMCPAgent($userMessageContent);

        if ($response->failed()) {
            Log::error('MCP Agent error', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return response()->json(['error' => "Erreur de l'agent IA"], 502);
        }

        $agentResponse = $response->json();
        $aiContent = $agentResponse['response'] ?? "Je n'ai pas compris.";

        $conversation->messages()->create([
            'role' => 'assistant',
            'content' => $aiContent,
            'company_id' => $user->company_id
        ]);

        $conversation->touch();

        return response()->json([
            'conversation_id' => $conversation->id,
            'message' => [
                'role' => 'assistant',
                'content' => $aiContent
            ]
        ]);
    }

    private function queryMCPAgent($message)
    {
        return Http::timeout(600)->post(
            "http://mcp-server:8000/ask",
            ["question" => $message]
        );
    }
}
