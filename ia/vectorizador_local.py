import os
import chromadb
from sentence_transformers import SentenceTransformer
import mysql.connector
import unicodedata
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

os.environ["CHROMA_TELEMETRY_DISABLED"] = "1"
os.environ["ANONYMIZED_TELEMETRY"] = "False"

DB_PATH = Path(__file__).parent / "chroma_db"
chroma_client = chromadb.PersistentClient(path=str(DB_PATH))
COLLECTION_NAME = "monkeymarket_catalog"

print("Cargando modelo de embeddings (esto puede tomar unos segundos)...")
embedder = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

def normalizar_texto(texto: str) -> str:
    texto = texto.lower().strip()
    texto = ''.join(
        c for c in unicodedata.normalize('NFD', texto)
        if unicodedata.category(c) != 'Mn'
    )
    return texto

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "monkey_market"),
        port=os.getenv("DB_PORT")
    )

def sync_mysql_to_chroma() -> str:
    try:
        print("🔌 Conectando a MySQL para sincronizar catálogo...")
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        documents  = []
        metadatas  = []
        ids        = []

        # ── Productos ─────────────────────────
        cursor.execute("""
            SELECT id, titulo, descripcion, precio, categoria
            FROM productos
            WHERE esta_activo = TRUE
        """)
        for row in cursor.fetchall():
            desc      = row['descripcion'] or "Sin descripción"
            texto_raw = f"{row['titulo']} - {desc}"
            documents.append(normalizar_texto(texto_raw))
            metadatas.append({
                "nombre":    str(row['titulo']),
                "precio":    float(row['precio'] or 0),
                "tipo":      "Producto",
                "categoria": str(row['categoria']),
            })
            ids.append(f"prod_{row['id']}")

        # ── Servicios ─────────────────────────
        cursor.execute("""
            SELECT id, titulo, descripcion, precio, categoria
            FROM servicios
            WHERE esta_activo = TRUE
        """)
        for row in cursor.fetchall():
            desc      = row['descripcion'] or "Sin descripción"
            texto_raw = f"{row['titulo']} - {desc}"
            documents.append(normalizar_texto(texto_raw))
            metadatas.append({
                "nombre":    str(row['titulo']),
                "precio":    float(row['precio'] or 0),
                "tipo":      "Servicio",
                "categoria": str(row['categoria']),
            })
            ids.append(f"serv_{row['id']}")

        cursor.close()
        conn.close()

        if not documents:
            print("⚠️  No se encontraron productos/servicios activos en MySQL.")
            return "No se encontraron items activos en MySQL."

        print(f"🧠 Generando vectores para {len(documents)} items...")

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
                ids=ids[i:end],
            )

        print(f"✅ Sincronización exitosa: {len(documents)} items indexados en ChromaDB.")
        return f"Sincronizados {len(documents)} items correctamente."

    except Exception as e:
        print(f"❌ Error en sincronización: {e}")
        return str(e)

if __name__ == "__main__":
    sync_mysql_to_chroma()