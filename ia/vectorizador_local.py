import os
import mysql.connector
import unicodedata
import chromadb
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

os.environ["CHROMA_TELEMETRY_DISABLED"] = "1"
os.environ["ANONYMIZED_TELEMETRY"] = "False"

DB_PATH = Path(__file__).parent / "chroma_db"
COLLECTION_NAME = "monkeymarket_catalog"

def normalizar_texto(texto: str) -> str:
    texto = texto.lower().strip()
    return ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 3306)),  # <--- ESTA ES LA LÍNEA MÁGICA
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "monkey_market")
    )

def sync_local():
    print("🔌 Conectando a MySQL local/nube para jalar catálogo...")
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    documents, metadatas, ids = [], [], []

    # Productos
    cursor.execute("SELECT id, titulo, descripcion, precio, categoria FROM productos WHERE esta_activo = TRUE")
    for row in cursor.fetchall():
        desc = row['descripcion'] or "Sin descripción"
        documents.append(normalizar_texto(f"{row['titulo']} - {desc}"))
        metadatas.append({"nombre": str(row['titulo']), "precio": float(row['precio'] or 0), "tipo": "Producto", "categoria": str(row['categoria'])})
        ids.append(f"prod_{row['id']}")

    # Servicios
    cursor.execute("SELECT id, titulo, descripcion, precio, categoria FROM servicios WHERE esta_activo = TRUE")
    for row in cursor.fetchall():
        desc = row['descripcion'] or "Sin descripción"
        documents.append(normalizar_texto(f"{row['titulo']} - {desc}"))
        metadatas.append({"nombre": str(row['titulo']), "precio": float(row['precio'] or 0), "tipo": "Servicio", "categoria": str(row['categoria'])})
        ids.append(f"serv_{row['id']}")

    cursor.close()
    conn.close()

    if not documents:
        print("⚠️ No hay items activos.")
        return

    print("🧠 Descargando/Cargando modelo pesado en tu PC...")
    embedder = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    
    print(f"🧬 Calculando vectores locales para {len(documents)} items...")
    chroma_client = chromadb.PersistentClient(path=str(DB_PATH))
    
    try:
        chroma_client.delete_collection(name=COLLECTION_NAME)
    except Exception:
        pass

    collection = chroma_client.create_collection(name=COLLECTION_NAME)
    embeddings = embedder.encode(documents).tolist()

    batch_size = 100
    for i in range(0, len(documents), batch_size):
        end = min(i + batch_size, len(documents))
        collection.add(
            embeddings=embeddings[i:end],
            documents=documents[i:end],
            metadatas=metadatas[i:end],
            ids=ids[i:end]
        )

    print(f"🎉 ¡Éxito! Carpeta './chroma_db' generada localmente con {len(documents)} vectores.")

if __name__ == "__main__":
    sync_local()