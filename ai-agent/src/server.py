import os
import json
import re
import traceback
from typing import Any, Dict, List, Optional

import requests as http_requests
from flask import Flask, request, jsonify
from ollama import Client

app = Flask(__name__)

# ============================================================
# CONFIGURATION
# ============================================================

ollama_host = os.getenv("OLLAMA_HOST", "http://ollama:11434")
ollama_client = Client(host=ollama_host)

ERP_API_BASE = os.getenv("ERP_API_URL", "http://erp-nginx/api/internal")
OPENAPI_URL = os.getenv("OPENAPI_URL", f"{ERP_API_BASE}/openapi")

OPENAPI_CACHE = None
TOOLS_CACHE = None

ALLOWED_INTERNAL_PREFIXES = (
    "clients",
    "chantiers",
    "employes",
    "materiels",
    "dashboard/stats",
    "planning/events"
)

# ============================================================
# RÉCUPÉRATION DE L'OPENAPI
# ============================================================

def load_openapi():
    try:
        print(f"[OpenAPI] Chargement : {OPENAPI_URL}")
        r = http_requests.get(OPENAPI_URL, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[OpenAPI] Erreur : {e}")
        return None

def get_openapi():
    global OPENAPI_CACHE
    if OPENAPI_CACHE is None:
        OPENAPI_CACHE = load_openapi()
    return OPENAPI_CACHE

# ============================================================
# CONSTRUCTION DES OUTILS (TOOLS)
# ============================================================

def allowed(path: str) -> bool:
    return any(path == p or path.startswith(p + "/") for p in ALLOWED_INTERNAL_PREFIXES)

def generate_tool_name(method: str, path: str) -> str:
    """
    Génère un nom déterministe compatible avec le fine-tuning.
    GET /clients       -> get_clients
    GET /clients/{id}  -> get_clients_by_id
    GET /chantiers     -> get_chantiers
    """
    prefix = method.lower()
    clean = path.strip("/")
    clean = re.sub(r"\{([^}]+)\}", r"by_\1", clean)
    clean = clean.replace("/", "_").replace("-", "_")
    clean = re.sub(r"_+", "_", clean)
    return f"{prefix}_{clean}"

def openapi_to_tools(spec: Dict[str, Any]) -> List[Dict[str, Any]]:
    if not spec:
        return []

    tools = []
    paths = spec.get("paths", {})

    for path, methods in paths.items():
        clean_path = path.replace("/api/internal", "").replace("/api", "").strip("/")

        if not allowed(clean_path):
            continue

        for method, details in methods.items():
            if method.lower() != "get":
                continue

            # NOM DÉTERMINISTE (coherent avec le fine-tuning)
            name = generate_tool_name(method, clean_path)

            # Description riche pour aider le LLM à choisir
            summary = details.get("summary", "")
            description = details.get("description", summary) or f"Accéder à {clean_path}"

            params = {"type": "object", "properties": {}, "required": []}

            for p in details.get("parameters", []):
                pname = p.get("name")
                if not pname:
                    continue

                # Les paramètres de chemin ne vont pas dans le schema JSON
                if p.get("in") == "path":
                    continue

                schema = p.get("schema") or {}
                params["properties"][pname] = {
                    "type": schema.get("type", "string"),
                    "description": p.get("description", pname)
                }
                if p.get("required"):
                    params["required"].append(pname)

            tools.append({
                "type": "function",
                "function": {
                    "name": name,
                    "description": description,
                    "parameters": params,
                    "x-path": clean_path,
                    "x-method": "GET"
                }
            })

    return tools

def get_tools():
    global TOOLS_CACHE
    if TOOLS_CACHE is None:
        spec = get_openapi()
        TOOLS_CACHE = openapi_to_tools(spec)
        print(f"[Tools] {len(TOOLS_CACHE)} outils chargés.")
        for t in TOOLS_CACHE:
            print(f"  - {t['function']['name']}: {t['function']['description']}")
    return TOOLS_CACHE

def build_tools_description(tools: List[Dict[str, Any]]) -> str:
    """Texte descriptif des outils pour le prompt système."""
    lines = []
    for tool in tools:
        fn = tool["function"]
        lines.append(f"• {fn['name']}: {fn['description']}")
        if fn["parameters"]["properties"]:
            for pname, pschema in fn["parameters"]["properties"].items():
                req = " (obligatoire)" if pname in fn["parameters"].get("required", []) else " (optionnel)"
                lines.append(f"    - {pname}{req}: {pschema.get('description', '')}")
    return "\n".join(lines)

# ============================================================
# EXÉCUTION DES APPELS API
# ============================================================

def call_api(endpoint, params=None):
    try:
        url = f"{ERP_API_BASE.rstrip('/')}/{endpoint.lstrip('/')}"
        print(f"[API Call] {url} avec params {params}")
        r = http_requests.get(url, params=params, timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[API Error] {e}")
        return {"error": f"Erreur lors de l'appel API : {str(e)}"}

def exec_tool(name, args, tools):
    tool = next((t for t in tools if t["function"]["name"] == name), None)
    if not tool:
        return {"error": f"Outil '{name}' non trouvé."}

    if isinstance(args, str):
        try:
            args = json.loads(args)
        except:
            args = {}
    if not isinstance(args, dict):
        args = {}

    path = tool["function"]["x-path"]

    # Gestion des paramètres de chemin {id}
    path_params = re.findall(r"\{([^}]+)\}", path)
    for p in path_params:
        if p in args:
            path = path.replace(f"{{{p}}}", str(args[p]))
            del args[p]
        else:
            return {"error": f"Paramètre requis manquant : {p}"}

    return call_api(path, args)

# ============================================================
# PROMPT SYSTÈME DYNAMIQUE
# ============================================================

def build_system_prompt() -> str:
    tools = get_tools()
    tools_desc = build_tools_description(tools) if tools else "Aucun outil disponible."

    return f"""Tu es l'assistant technique de l'ERP RoadToTP.
Tu as accès aux outils suivants pour interroger la base de données :

{tools_desc}

RÈGLES ABSOLUES :
1. Dès qu'une question concerne des données (clients, chantiers, employés, matériels, stats, planning), tu DOIS appeler l'outil correspondant.
2. Tu ne dois JAMAIS inventer de noms de clients ou de chantiers.
3. Utilise UNIQUEMENT les données JSON retournées par les outils pour répondre.
4. Si l'outil retourne une liste vide ou une erreur, dis que l'information n'est pas trouvée dans la base.


Réponds en français, de manière concise."""

# ============================================================
# ROUTE PRINCIPALE
# ============================================================

@app.route("/ask", methods=["POST"])
def ask():
    try:
        data = request.get_json(force=True) or {}
        question = data.get("question", "").strip()

        if not question:
            return jsonify({"error": "Question vide"}), 400

        tools = get_tools()
        if not tools:
            return jsonify({"error": "Aucun outil disponible"}), 503

        system_prompt = build_system_prompt()
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ]

        # Boucle de réflexion (Tool Calling)
        for i in range(5):
            print(f"[Iteration {i+1}] Envoi à Ollama...")
            response = ollama_client.chat(
                model="test:latest",
                messages=messages,
                tools=tools
            )

            msg = response.get("message", {})
            messages.append(msg)

            # Si pas de tool_calls, c'est la réponse finale
            if not msg.get("tool_calls"):
                break

            # Exécution des appels d'outils demandés
            for tc in msg["tool_calls"]:
                fn = tc.get("function", {})
                name = fn.get("name")
                args = fn.get("arguments", {})

                print(f"  -> Exécution outil : {name}({args})")
                result = exec_tool(name, args, tools)

                messages.append({
                    "role": "tool",
                    "content": json.dumps(result, ensure_ascii=False)
                })

        return jsonify({"response": msg.get("content", "")})

    except Exception as e:
        print("[FATAL ERROR]")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/health")
def health():
    return jsonify({"status": "ok", "tools": len(get_tools() or [])})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, threaded=True)
