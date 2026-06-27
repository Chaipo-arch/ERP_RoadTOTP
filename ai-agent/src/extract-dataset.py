import os
import json
import fitz
from bs4 import BeautifulSoup

INPUT_DIR = "docs"
OUTPUT_FILE = "dataset.jsonl"

def extract_pdf(path):
    text = ""
    doc = fitz.open(path)

    for page in doc:
        text += page.get_text()

    return text


def extract_html(path):
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    return soup.get_text(separator=" ")


def clean_text(text):
    return " ".join(text.split())


with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
    for root, _, files in os.walk(INPUT_DIR):
        for file in files:
            path = os.path.join(root, file)

            try:
                text = ""

                if file.endswith(".pdf"):
                    text = extract_pdf(path)

                elif file.endswith(".html") or file.endswith(".htm"):
                    text = extract_html(path)

                text = clean_text(text)

                if len(text) > 100:
                    sample = {
                        "text": text
                    }

                    out.write(json.dumps(sample, ensure_ascii=False) + "\n")

                print(f"OK {file}")

            except Exception as e:
                print(f"ERREUR {file}: {e}")