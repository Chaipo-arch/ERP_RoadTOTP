FROM python:3.11-slim

WORKDIR /app/src

# Installation des dépendances système si besoin (ex: clients SQL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Installation des libs IA et outils
RUN pip install --no-cache-dir \
    fastmcp \
    mysql-connector-python \
    ollama \
    chromadb \
    requests \
    flask \
    uvicorn \
    python-dotenv

# On expose le port si tu utilises le mode SSE (Server-Sent Events) de MCP
EXPOSE 8000

# On lance le serveur situé dans ton dossier src
CMD ["python", "server.py"]