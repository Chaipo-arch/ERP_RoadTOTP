import time
import re
import requests
from bs4 import BeautifulSoup
import chromadb
from duckduckgo_search import DDGS

# ============================================================
# 1. CONNEXION DIRECTE AU DOCKER CHROMADB
# ============================================================
try:
    # Depuis ta machine hôte, le conteneur chromadb est sur localhost:8000
    chroma_client = chromadb.HttpClient(host="localhost", port=8000)
    collection = chroma_client.get_or_create_collection(name="tp_knowledge")
    print("🔌 Connexion réussie au ChromaDB du Docker !")
except Exception as e:
    print(f"❌ Impossible de se connecter à ChromaDB. Vérifie que 'docker compose up' tourne.\nErreur : {e}")
    exit(1)

# Mots-clés ciblés pour le monde du TP et des Marchés Publics
KEYWORDS = [
    "CCAG travaux",
    "CCTP VRD",
    "terrassement routier",
    "assainissement gravitaire",
    "assainissement eaux pluviales",
    "réseaux humides",
    "réseaux secs",
    "enrobés bitumineux",
    "chaussées routières",
    "signalisation routière",
    "marchés publics travaux",
    "fascicule 70",
    "fascicule 71",
    "guide CEREMA voirie",
    "guide FNTP",
    "ouvrage d'art",
    "béton armé",
    "fondations spéciales",
    "canalisations enterrées",
    "tranchées techniques",
    "DT DICT",
    "AIPR",
    "gestion chantier",
    "plan assurance qualité chantier",
    "coordination SPS",
]

# ============================================================
# 2. FONCTION DE SCRAPING DE PAGE WEB
# ============================================================
def scratch_page_text(url):
    """Télécharge une page web et extrait le texte brut proprement."""
    try:
        # User-Agent pour éviter d'être bloqué instantanément par les sites
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=8)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            # Nettoyage du code HTML inutile
            for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
                element.decompose()
            
            # Récupération du texte nettoyé
            text = " ".join(soup.get_text().split())
            return text
    except Exception:
        # Si un site bloque (403, timeout...), on l'ignore silencieusement et on passe à la suite
        return None
    return None

# ============================================================
# 3. BOUCLE PRINCIPALE : RECHERCHE -> SCRAPE -> DOCKER
# ============================================================
def run_pipeline():
    print(f"🔎 Début de la recherche web (4 thématiques TP)...")
    id_counter = collection.count() # Pour ne pas écraser les anciennes données si tu le relances
    
    with DDGS() as ddgs:
        for keyword in KEYWORDS:
            print(f"\n🚀 Recherche DuckDuckGo : '{keyword}'")
            try:
                # On récupère les 4 meilleurs liens pour chaque mot-clé
                results = ddgs.text(keyword, region='fr-fr', safesearch='moderate', max_results=8)
                
                for res in results:
                    url = res['href']
                    title = res['title']
                    print(f"  🌐 Extraction de : {title[:50]}... ({url})")
                    
                    content = scratch_page_text(url)
                    
                   # À l'intérieur de ta boucle, après avoir découpé en chunks
                    if content and len(content) > 300:
                        chunks = [content[i:i+1000] for i in range(0, len(content), 800)]
                        
                        # === NOUVEAU : on prépare les listes pour le BATCH ===
                        collection.add(
                            documents=chunks,  # Liste de tous les chunks de la page
                            metadatas=[{"source": url, "title": title}] * len(chunks),  # Multiplie la métadonnée
                            ids=[f"web_{id_counter + i}" for i in range(len(chunks))]  # Génère les IDs en une fois
                        )
                        id_counter += len(chunks)
                        print(f"    ✅ Indexé ! (+{len(chunks)} fragments ajoutés en BATCH)")
                        # Fin du "for chunk in chunks" - on le supprime !
                    else:
                        print(f"    ⚠️ Page ignorée (bloquée ou vide)")
                        
                    # Petite pause pour respecter les serveurs web
                    time.sleep(0.5)
                    
            except Exception as e:
                print(f"  ❌ Erreur lors de la recherche pour '{keyword}': {e}")

    print(f"\n🎉 Terminé ! Ton RAG Docker contient maintenant {collection.count()} fragments de connaissances TP.")

if __name__ == "__main__":
    run_pipeline()