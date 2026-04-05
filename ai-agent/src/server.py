import os
import json
import mysql.connector
import requests as http_requests
from flask import Flask, request, jsonify
from ollama import Client

app = Flask(__name__)
ollama_host = os.getenv("OLLAMA_HOST", "http://ollama:11434")
ollama_client = Client(host=ollama_host)

# URL interne du backend Laravel (dans le réseau Docker) — routes internes sans auth
ERP_API_BASE = os.getenv("ERP_API_URL", "http://nginx/api/internal")

# ============================================================
# OUTILS (fonctions que le LLM peut appeler)
# ============================================================

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "list_clients",
            "description": "Lister tous les clients de l'ERP. Peut filtrer par type (Public/Privé) et rechercher par nom.",
            "parameters": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "description": "Filtrer par type de client: 'Public' ou 'Privé'",
                        "enum": ["Public", "Privé"]
                    },
                    "search": {
                        "type": "string",
                        "description": "Rechercher par nom du client ou nom du contact"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_client",
            "description": "Obtenir les détails d'un client spécifique avec ses chantiers associés.",
            "parameters": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "integer",
                        "description": "L'ID du client"
                    }
                },
                "required": ["id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_chantiers",
            "description": "Lister tous les chantiers (projets de construction) de l'ERP.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "description": "Filtrer par statut: 'En cours', 'Planifié', 'Terminé', 'Suspendu'",
                        "enum": ["En cours", "Planifié", "Terminé", "Suspendu"]
                    },
                    "search": {
                        "type": "string",
                        "description": "Rechercher par nom du chantier"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_chantier",
            "description": "Obtenir les détails d'un chantier spécifique.",
            "parameters": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "integer",
                        "description": "L'ID du chantier"
                    }
                },
                "required": ["id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_employes",
            "description": "Lister tous les employés de l'entreprise.",
            "parameters": {
                "type": "object",
                "properties": {
                    "search": {
                        "type": "string",
                        "description": "Rechercher par nom de l'employé"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_employe",
            "description": "Obtenir les détails d'un employé spécifique.",
            "parameters": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "integer",
                        "description": "L'ID de l'employé"
                    }
                },
                "required": ["id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_materiels",
            "description": "Lister tout le matériel/équipement de l'entreprise.",
            "parameters": {
                "type": "object",
                "properties": {
                    "search": {
                        "type": "string",
                        "description": "Rechercher par nom du matériel"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_dashboard_stats",
            "description": "Obtenir les statistiques du tableau de bord: nombre de chantiers, clients, employés, etc.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_planning_events",
            "description": "Obtenir les événements du planning/calendrier.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_database",
            "description": "Exécuter une requête SQL SELECT en lecture seule sur la base de données de l'ERP. Utiliser uniquement pour des requêtes complexes que les autres outils ne couvrent pas. Tables disponibles: clients, chantiers, employes, materiels, planning_events, documents, teams, leave_requests.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "La requête SQL SELECT à exécuter (lecture seule)"
                    }
                },
                "required": ["query"]
            }
        }
    }
]

# ============================================================
# EXÉCUTION DES OUTILS
# ============================================================

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "mysql"),
        user=os.getenv("DB_USER", "erp_user"),
        password=os.getenv("DB_PASSWORD", "erp_password"),
        database=os.getenv("DB_NAME", "erp_roadtotp")
    )


def call_erp_api(endpoint, params=None):
    """Appelle l'API ERP Laravel en interne (réseau Docker)."""
    try:
        url = f"{ERP_API_BASE}/{endpoint}"
        response = http_requests.get(url, params=params, timeout=90)
        response.raise_for_status()
        return response.json()
    except http_requests.exceptions.RequestException as e:
        return {"error": f"Erreur API: {str(e)}"}


def execute_tool(tool_name, arguments):
    """Exécute un outil et retourne le résultat."""
    try:
        if tool_name == "list_clients":
            params = {}
            if arguments.get("type"):
                params["type"] = arguments["type"]
            if arguments.get("search"):
                params["search"] = arguments["search"]
            return call_erp_api("clients", params)

        elif tool_name == "get_client":
            return call_erp_api(f"clients/{arguments['id']}")

        elif tool_name == "list_chantiers":
            params = {}
            if arguments.get("status"):
                params["status"] = arguments["status"]
            if arguments.get("search"):
                params["search"] = arguments["search"]
            return call_erp_api("chantiers", params)

        elif tool_name == "get_chantier":
            return call_erp_api(f"chantiers/{arguments['id']}")

        elif tool_name == "list_employes":
            params = {}
            if arguments.get("search"):
                params["search"] = arguments["search"]
            return call_erp_api("employes", params)

        elif tool_name == "get_employe":
            return call_erp_api(f"employes/{arguments['id']}")

        elif tool_name == "list_materiels":
            params = {}
            if arguments.get("search"):
                params["search"] = arguments["search"]
            return call_erp_api("materiels", params)

        elif tool_name == "get_dashboard_stats":
            return call_erp_api("dashboard/stats")

        elif tool_name == "get_planning_events":
            return call_erp_api("planning/events")

        elif tool_name == "query_database":
            query = arguments.get("query", "")
            # Sécurité : n'autoriser que les SELECT
            if not query.strip().upper().startswith("SELECT"):
                return {"error": "Seules les requêtes SELECT sont autorisées."}
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(query)
            results = cursor.fetchall()
            cursor.close()
            conn.close()
            
            # Limiter les résultats pour ne pas surcharger le LLM
            if len(results) > 50:
                return {
                    "total": len(results),
                    "results": results[:50],
                    "note": f"Affichage limité à 50 résultats sur {len(results)} au total."
                }
            return results

        else:
            return {"error": f"Outil '{tool_name}' inconnu."}

    except Exception as e:
        return {"error": f"Erreur lors de l'exécution de '{tool_name}': {str(e)}"}


# ============================================================
# PROMPT SYSTÈME
# ============================================================

SYSTEM_PROMPT = """Tu es l'assistant IA de RoadToTP, un ERP spécialisé dans le BTP (Bâtiment et Travaux Publics).

Tu as accès aux données de l'entreprise via des outils. Quand l'utilisateur te pose une question sur les clients, chantiers, employés, matériel, planning ou statistiques, utilise les outils disponibles pour récupérer les données réelles.

Règles importantes:
1. Utilise TOUJOURS les outils pour accéder aux données. Ne jamais inventer de données.
2. Réponds en français de manière professionnelle et concise.
3. Quand tu listes des éléments, formate-les clairement (avec des numéros ou des tirets).
4. Si une requête est ambiguë, utilise l'outil le plus pertinent et demande des précisions si nécessaire.
5. Pour les requêtes complexes nécessitant des agrégations ou jointures, utilise l'outil query_database.
6. Ne modifie jamais les données (pas d'INSERT, UPDATE, DELETE via SQL).

Exemples de questions que tu peux traiter:
- "Liste tous mes clients" → utilise list_clients
- "Combien ai-je de chantiers en cours ?" → utilise list_chantiers avec status "En cours"
- "Montre-moi les détails du client 5" → utilise get_client avec id=5
- "Quelles sont les stats de mon entreprise ?" → utilise get_dashboard_stats
- "Quel est le budget total de mes chantiers ?" → utilise query_database avec un SELECT SUM
"""


# ============================================================
# ENDPOINT PRINCIPAL
# ============================================================

@app.route('/ask', methods=['POST'])
def ask():
    try:
        data = request.get_json()
        question = data.get("question", "")

        if not question.strip():
            return jsonify({"response": "Veuillez poser une question."}), 400

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ]

        # Premier appel : le LLM décide s'il doit appeler un outil
        response = ollama_client.chat(
            model='qwen2.5:3b-instruct',
            messages=messages,
            tools=TOOLS,
        )

        assistant_message = response['message']

        # Si le LLM veut appeler des outils (tool_calls)
        max_iterations = 5
        iteration = 0

        while assistant_message.get('tool_calls') and iteration < max_iterations:
            iteration += 1
            messages.append(assistant_message)

            # Exécuter chaque outil demandé
            for tool_call in assistant_message['tool_calls']:
                tool_name = tool_call['function']['name']
                tool_args = tool_call['function'].get('arguments', {})

                print(f"[Agent] Appel outil: {tool_name}({json.dumps(tool_args, ensure_ascii=False)})")
                
                tool_result = execute_tool(tool_name, tool_args)
                result_str = json.dumps(tool_result, ensure_ascii=False, default=str)
                
                # Limiter la taille du résultat pour ne pas dépasser le contexte du LLM
                if len(result_str) > 8000:
                    result_str = result_str[:8000] + '... (résultat tronqué)'

                print(f"[Agent] Résultat: {result_str[:200]}...")

                messages.append({
                    "role": "tool",
                    "content": result_str,
                })

            # Rappeler le LLM avec les résultats des outils
            response = ollama_client.chat(
                model='qwen2.5:3b-instruct',
                messages=messages,
                tools=TOOLS,
            )
            assistant_message = response['message']

        final_content = assistant_message.get('content', "Je n'ai pas pu traiter votre demande.")
        return jsonify({"response": final_content})

    except Exception as e:
        print(f"[Agent] Erreur: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Endpoint de santé pour vérifier que l'agent est opérationnel."""
    return jsonify({"status": "ok", "tools_count": len(TOOLS)})


if __name__ == "__main__":
    print(f"[Agent] Démarrage du serveur MCP sur port 8000")
    print(f"[Agent] Ollama host: {ollama_host}")
    print(f"[Agent] ERP API base: {ERP_API_BASE}")
    print(f"[Agent] {len(TOOLS)} outils disponibles")
    app.run(host="0.0.0.0", port=8000)