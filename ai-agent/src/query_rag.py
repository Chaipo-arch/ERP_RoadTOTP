import json
import chromadb
import ollama

# 1. Initialisation de la base de données vectorielle locale sur le VPS
chroma_client = chromadb.PersistentClient(path="./tp_vector_db")
collection = chroma_client.get_or_create_collection(name="tp_knowledge")

def index_data():
    """Découpe et charge les données scrapées dans la base de données."""
    if collection.count() > 0:
        print("💡 La base de données est déjà indexée.")
        return

    print("📦 Indexation des données de Travaux Publics...")
    with open("knowledge_tp.json", "r", encoding="utf-8") as f:
        docs = json.load(f)
        
    id_counter = 0
    for doc in docs:
        content = doc["content"]
        # Découpage par morceaux d'environ 1000 caractères pour le contexte du LLM
        chunks = [content[i:i+1000] for i in range(0, len(content), 800)]
        
        for chunk in chunks:
            collection.add(
                documents=[chunk],
                metadatas=[{"source": doc["url"], "title": doc["title"]}],
                ids=[f"id_{id_counter}"]
            )
            id_counter += 1
    print(f"✅ {collection.count()} fragments de connaissances TP prêts.")

def ask_qwen_with_tp_knowledge(user_question):
    """Recherche la bonne info technique et interroge Qwen."""
    # 2. Recherche des 3 fragments de texte les plus pertinents par rapport à la question
    results = collection.query(query_texts=[user_question], n_results=3)
    context = "\n---\n".join(results['documents'][0])
    
    # 3. Construction du prompt enrichi (RAG)
    prompt = f"""Tu es un ingénieur expert en Travaux Publics. Réponds à la question en te basant UNIQUEMENT sur le contexte technique fourni ci-dessous. Si le contexte ne contient pas la réponse, utilise tes connaissances générales en TP pour répondre au mieux, mais reste rigoureux.

CONTEXTE TECHNIQUE :
{context}

QUESTION : {user_question}
RÉPONSE :"""

    # 4. Appel de Qwen 2.5 3B en local sur ton VPS
    response = ollama.generate(model="qwen2.5:3b", prompt=prompt)
    return response['response']

if __name__ == "__main__":
    # Charge la data lors du premier lancement
    index_data()
    
    # Exemple de question
    question = "Quelles sont les spécificités de mise en oeuvre d'un enrobé à chaud ?"
    print(f"\n❓ Question : {question}\n")
    
    print("🤖 Qwen réfléchit...")
    reponse = ask_qwen_with_tp_knowledge(question)
    print(f"\n📢 Réponse de Qwen :\n{reponse}")