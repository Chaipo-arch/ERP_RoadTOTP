import os
import sys
import time
import traceback
from contextlib import contextmanager

from flask import Flask, request, jsonify
from ollama import Client
import chromadb

app = Flask(__name__)

# ============================================================
# FORCER LE FLUSH IMMÉDIAT DE LA CONSOLE
# ============================================================
sys.stdout.reconfigure(line_buffering=True)  # Python 3.7+

# ============================================================
# CONFIGURATION & CLIENTS
# ============================================================
ollama_host = os.getenv("OLLAMA_HOST", "http://ollama:11434")
ollama_client = Client(host=ollama_host)

chroma_host = os.getenv("CHROMA_HOST", "chromadb")
chroma_client = chromadb.HttpClient(host=chroma_host, port=8000)
chroma_collection = chroma_client.get_or_create_collection(name="tp_knowledge")

# ============================================================
# TIMER
# ============================================================
@contextmanager
def timer(name):
    start = time.perf_counter()
    yield
    elapsed = time.perf_counter() - start
    print(f"[TIMER] {name:<35} {elapsed:.3f}s")
    sys.stdout.flush()

# ============================================================
# PROMPT SYSTÈME (SANS OUTILS)
# ============================================================
def build_system_prompt(tp_context: str) -> str:
    return f"""Tu es l'assistant IA expert de l'ERP RoadToTP, spécialisé dans les Travaux Publics et les Marchés Publics.

CONNAISSANCES MÉTIER (extrait de la base de connaissances) :
{tp_context}

RÈGLES :
1. Utilise exclusivement le texte ci‑dessus pour répondre aux questions techniques, réglementaires ou métier.
2. Si la réponse ne se trouve pas dans le texte, dis clairement que tu ne sais pas (ne invente rien).
3. Réponds toujours en français, de manière claire, concise et professionnelle.
4. Ne mentionne jamais que tu as reçu un contexte, réponds naturellement."""

# ============================================================
# ROUTE PRINCIPALE : /ask (RAG + génération)
# ============================================================
@app.route("/ask", methods=["POST"])
def ask():
    start_request = time.perf_counter()

    try:
        data = request.get_json(force=True) or {}
        question = data.get("question", "").strip()

        if not question:
            return jsonify({"error": "Question vide"}), 400

        # 1. Récupération des documents pertinents depuis ChromaDB
        with timer("Recherche ChromaDB"):
            rag_results = chroma_collection.query(
                query_texts=[question],
                n_results=2  # On limite à 2 chunks pour la vitesse
            )
        tp_context = "\n\n".join(rag_results['documents'][0]) if rag_results['documents'] else ""

        # 2. Construction du prompt système
        with timer("Construction System Prompt"):
            system_prompt = build_system_prompt(tp_context)

        # 3. Appel à Ollama (sans outils)
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ]

        with timer("Ollama Chat"):
            response = ollama_client.chat(
                model="tp-rag:latest",
                messages=messages,
                options={"num_ctx": 2048}  # Fenêtre de contexte réduite pour la performance
            )

        reply = response.get("message", {}).get("content", "")

        # 4. Affichage des temps
        print("=" * 60)
        print(f"[TOTAL REQUEST] {time.perf_counter() - start_request:.3f}s")
        print("=" * 60)
        sys.stdout.flush()

        return jsonify({"response": reply})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ============================================================
# ROUTE D'INGESTION (pour enrichir la base)
# ============================================================
@app.route("/ingest", methods=["POST"])
def ingest():
    data = request.get_json(force=True) or {}
    text = data.get("text")
    source = data.get("source", "manual")

    if not text:
        return jsonify({"error": "Texte manquant"}), 400

    count = chroma_collection.count()
    chroma_collection.add(
        documents=[text],
        metadatas=[{"source": source}],
        ids=[f"doc_{count + 1}"]
    )
    return jsonify({"status": "success", "message": "Connaissance TP enregistrée !"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, threaded=True)