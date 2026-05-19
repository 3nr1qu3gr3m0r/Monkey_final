from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import chromadb
from sentence_transformers import SentenceTransformer
import os

os.environ["CHROMA_TELEMETRY_DISABLED"] = "1"
os.environ["ANONYMIZED_TELEMETRY"] = "False"

from typing import List, Dict, Any
import json
from pathlib import Path
from google import genai
from dotenv import load_dotenv
import mysql.connector
import unicodedata

load_dotenv()

# ============================================================
# INICIALIZACIÓN DE LA APP Y CICLO DE VIDA (CORREGIDO)
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _categorias_disponibles
    _categorias_disponibles = cargar_categorias_desde_db()
    yield

app = FastAPI(title="MonkeyMarket AI Service", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# CLIENTE DE IA (GEMINI)
# ============================================================
google_api_key = os.getenv("GOOGLE_API_KEY")
if not google_api_key:
    print("⚠️  GOOGLE_API_KEY no encontrada en el archivo .env")
    client_ai = None
else:
    client_ai = genai.Client(api_key=google_api_key)

# ============================================================
# CLIENTE DE CHROMADB
# ============================================================
DB_PATH = Path(__file__).parent / "chroma_db"
chroma_client = chromadb.PersistentClient(path=str(DB_PATH))
COLLECTION_NAME = "monkeymarket_catalog"

print("Cargando modelo de embeddings (esto puede tomar unos segundos)...")
embedder = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

# ============================================================
# ESTADO GLOBAL — se populan al arrancar y al llamar /sync
# ============================================================
response_cache: Dict[str, Any] = {}
_categorias_disponibles: List[Dict] = []   # [{id, nombre, descripcion}, ...]

# ============================================================
# MODELOS PYDANTIC
# ============================================================
class Message(BaseModel):
    role: str
    content: str

class AnalyzeRequest(BaseModel):
    message: str
    history: List[Message] = []

class AnalyzeResponse(BaseModel):
    action: str
    content: str
    entities: dict

# ============================================================
# UTILIDADES
# ============================================================
def normalizar_texto(texto: str) -> str:
    """
    Convierte a minúsculas y elimina acentos/diacríticos.
    Ej: "Música Súper" -> "musica super"
    Evita que ChromaDB falle por variaciones de acentuación.
    """
    texto = texto.lower().strip()
    texto = ''.join(
        c for c in unicodedata.normalize('NFD', texto)
        if unicodedata.category(c) != 'Mn'
    )
    return texto

def get_db_connection():
    """Helper reutilizable para conexiones a MySQL."""
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "monkey_market")
    )

# ============================================================
# CARGA DE CATÁLOGO DE CATEGORÍAS DESDE MYSQL
# ============================================================
def cargar_categorias_desde_db() -> List[Dict]:
    """
    Lee la tabla `categorias` desde MySQL.
    La descripción de cada categoría es el contexto que
    Gemini usará para clasificar la intención del usuario
    sin necesidad de listas de palabras clave.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre, descripcion
            FROM categorias
            WHERE activa = TRUE
            ORDER BY nombre
        """)
        cats = cursor.fetchall()
        cursor.close()
        conn.close()
        print(f"✅ {len(cats)} categorías cargadas desde MySQL.")
        return cats
    except Exception as e:
        print(f"❌ Error cargando categorías: {e}")
        return []

# ============================================================
# SINCRONIZACIÓN MYSQL → CHROMADB
# ============================================================
def sync_mysql_to_chroma() -> str:
    """
    Lee productos y servicios de MySQL, genera embeddings
    y los indexa en ChromaDB para búsqueda semántica.
    Se ejecuta al arrancar y cuando se llama GET /sync.
    """
    try:
        print("🔌 Conectando a MySQL para sincronizar catálogo...")
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        documents  = []
        metadatas  = []
        ids        = []

        # ── Productos (CORREGIDO) ─────────────────────────
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

        # ── Servicios (CORREGIDO) ─────────────────────────
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

        # Recrea la colección para garantizar datos frescos
        try:
            chroma_client.delete_collection(name=COLLECTION_NAME)
        except Exception:
            pass

        collection = chroma_client.create_collection(name=COLLECTION_NAME)
        embeddings = embedder.encode(documents).tolist()

        # Inserta en lotes para no saturar memoria
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

# ============================================================
# CLASIFICADOR INTELIGENTE CON GEMINI
# ============================================================
def clasificar_intencion_con_gemini(
    mensaje: str,
    historial: List[Message],
    categorias: List[Dict]
) -> Dict[str, Any]:
    """
    Primera llamada a Gemini: clasificación de intención.
    Es un prompt pequeño y rápido cuyo único output es JSON.
    No genera texto para el usuario.
    """
    if not client_ai:
        return {
            "categorias_detectadas":   [],
            "tematica":                None,
            "query_optimizada":        mensaje,
            "tiene_suficiente_contexto": True,
        }

    catalogo_texto = "\n".join([
        f'- "{cat["nombre"]}": {cat["descripcion"] or "Sin descripción"}'
        for cat in categorias
    ])

    historial_str = "\n".join([
        f"{msg.role}: {msg.content}"
        for msg in historial[-3:]
    ]) if historial else "Sin historial previo."

    prompt = f"""
Eres un clasificador de intenciones para un marketplace de eventos en México.
Tu ÚNICA tarea es analizar el mensaje y devolver un JSON estructurado.
NO generes texto adicional, solo el JSON.

CATÁLOGO DE CATEGORÍAS DISPONIBLES:
{catalogo_texto}

HISTORIAL RECIENTE DE LA CONVERSACIÓN:
{historial_str}

MENSAJE ACTUAL DEL USUARIO:
"{mensaje}"

INSTRUCCIONES:
1. Corrige mentalmente los errores ortográficos antes de clasificar.
   Ejemplos: "mussica" -> música, "dkoracion" -> decoración, "kiero" -> quiero.
2. Identifica qué categorías del catálogo necesita el usuario (puede ser más de una).
   Los nombres en "categorias_detectadas" deben ser EXACTAMENTE como aparecen en el catálogo.
3. Detecta si hay una temática específica (super heroes, dinosaurios, boda, xv años,
   Barbie, Star Wars, etc.). Si no hay temática, devuelve null.
   Las temáticas son LIBRES, no tienen una lista fija: detecta cualquiera que el usuario mencione.
4. Genera una "query_optimizada": el mensaje reescrito de forma clara para búsqueda semántica,
   en español correcto, sin errores, máximo 20 palabras.
5. "tiene_suficiente_contexto" es false SOLO si el mensaje es demasiado vago para inferir
   cualquier intención (ej: "hola", "ayuda", "quiero algo bonito").
   Si hay aunque sea un tipo de evento o servicio mencionado, es true.

RESPONDE ÚNICAMENTE CON ESTE JSON (sin backticks, sin markdown, sin explicaciones):
{{
  "categorias_detectadas": ["nombre exacto de categoría 1", "nombre exacto de categoría 2"],
  "tematica": "nombre de la temática o null",
  "query_optimizada": "query limpia para búsqueda semántica",
  "tiene_suficiente_contexto": true
}}
"""

    try:
        response = client_ai.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        raw      = response.text.strip().replace("```json", "").replace("```", "").strip()
        # BLINDAJE JSON (CORREGIDO)
        raw = raw.replace("\n", "\\n").replace("\r", "")
        resultado = json.loads(raw, strict=False)

        # Validamos que las categorías devueltas existan en el catálogo real
        nombres_validos = {cat["nombre"] for cat in categorias}
        resultado["categorias_detectadas"] = [
            c for c in resultado.get("categorias_detectadas", [])
            if c in nombres_validos
        ]

        print(f"🧠 Clasificación Gemini: {resultado}")
        return resultado

    except Exception as e:
        print(f"⚠️  Error en clasificador Gemini: {e}. Usando fallback sin filtros.")
        return {
            "categorias_detectadas":     [],
            "tematica":                  None,
            "query_optimizada":          mensaje,
            "tiene_suficiente_contexto": True,
        }

# ============================================================
# ENDPOINTS
# ============================================================
@app.get("/health")
async def health_check():
    return {
        "status":     "ok",
        "version":    "2.0.0",
        "categorias": len(_categorias_disponibles),
        "gemini":     client_ai is not None,
    }

@app.get("/sync")
async def force_sync():
    global _categorias_disponibles
    _categorias_disponibles = cargar_categorias_desde_db()
    resultado = sync_mysql_to_chroma()
    response_cache.clear()
    return {
        "status":     "ok",
        "message":    resultado,
        "categorias": len(_categorias_disponibles),
    }

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_message(request: AnalyzeRequest):
    if not client_ai:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_API_KEY no configurada en el archivo .env"
        )

    try:
        # ── CACHÉ ──────────────────────────────────────────────────────────
        cache_key = request.message.strip().lower()
        if cache_key in response_cache and not request.history:
            print(f"⚡ Cache hit: '{cache_key}'")
            return response_cache[cache_key]

        # ── PASO 1: Gemini clasifica la intención ──────────────────────────
        clasificacion = clasificar_intencion_con_gemini(
            mensaje=request.message,
            historial=request.history,
            categorias=_categorias_disponibles,
        )

        if not clasificacion.get("tiene_suficiente_contexto", True):
            return AnalyzeResponse(
                action="QUESTION",
                content=(
                    "¡Hola! Con gusto te ayudo a planear tu evento. "
                    "¿Me puedes contar un poco más? Por ejemplo, "
                    "¿qué tipo de celebración es y qué servicios necesitas?"
                ),
                entities={"recommendations": []},
            )

        query_limpia    = clasificacion.get("query_optimizada", request.message)
        categorias_req  = clasificacion.get("categorias_detectadas", [])
        tematica        = clasificacion.get("tematica")

        # ── PASO 2: Búsqueda semántica en ChromaDB ─────────────────────────
        collection      = chroma_client.get_or_create_collection(name=COLLECTION_NAME)
        query_embedding = embedder.encode(normalizar_texto(query_limpia)).tolist()
        filtro_tema     = {"$contains": tematica} if tematica else None

        grouped_by_category: Dict[str, List] = {}
        seen_names: set = set()

        def procesar_resultados(search_results: dict, cat_label: str):
            if cat_label not in grouped_by_category:
                grouped_by_category[cat_label] = []
            if not search_results.get('metadatas') or not search_results['metadatas'][0]:
                return
            for i, meta in enumerate(search_results['metadatas'][0]):
                nombre = meta.get("nombre", "Sin nombre")
                if nombre not in seen_names:
                    seen_names.add(nombre)
                    grouped_by_category[cat_label].append({
                        "id":        search_results['ids'][0][i],
                        "nombre":    nombre,
                        "precio":    meta.get("precio", 0.0),
                        "tipo":      meta.get("tipo", "Producto"),
                        "categoria": cat_label,
                    })

        if categorias_req:
            for cat in categorias_req:
                if filtro_tema:
                    try:
                        res = collection.query(
                            query_embeddings=[query_embedding],
                            n_results=10,
                            where={"categoria": cat},
                            where_document=filtro_tema,
                        )
                        procesar_resultados(res, cat)
                    except Exception:
                        pass

                if len(grouped_by_category.get(cat, [])) < 3:
                    res = collection.query(
                        query_embeddings=[query_embedding],
                        n_results=10,
                        where={"categoria": cat},
                    )
                    procesar_resultados(res, cat)
        else:
            kwargs: Dict[str, Any] = {
                "query_embeddings": [query_embedding],
                "n_results":        20,
            }
            if filtro_tema:
                kwargs["where_document"] = filtro_tema
            res = collection.query(**kwargs)
            procesar_resultados(res, "Varios")

            if not grouped_by_category.get("Varios"):
                res_fallback = collection.query(
                    query_embeddings=[query_embedding],
                    n_results=20,
                )
                procesar_resultados(res_fallback, "Varios")

        unique_recommendations: List[Dict] = []
        context_texts: List[str] = []
        TARJETAS_MAXIMAS = 12

        while (
            len(unique_recommendations) < TARJETAS_MAXIMAS
            and any(grouped_by_category.values())
        ):
            for cat in list(grouped_by_category.keys()):
                if grouped_by_category[cat] and len(unique_recommendations) < TARJETAS_MAXIMAS:
                    item = grouped_by_category[cat].pop(0)
                    unique_recommendations.append(item)
                    context_texts.append(
                        f"- ID: {item['id']} | {item['nombre']} | Cat: {item['categoria']}"
                    )

        if not unique_recommendations:
            return AnalyzeResponse(
                action="QUESTION",
                content=(
                    "No encontré opciones exactas para eso en el catálogo. "
                    "¿Quieres intentar con otra temática o tipo de servicio?"
                ),
                entities={"recommendations": []},
            )

        # ── PASO 3: Gemini genera la respuesta amigable ────────────────────
        context_str  = "\n".join(context_texts)
        history_str  = "\n".join([
            f"{m.role}: {m.content}" for m in request.history[-6:]
        ])
        tematica_str = (
            f'Temática detectada: "{tematica}"'
            if tematica
            else "Sin temática específica."
        )
        cats_str = ", ".join(categorias_req) if categorias_req else "búsqueda abierta"

        prompt_redactor = f"""
Eres un asistente mexicano de eventos para MonkeyMarket.
Responde siempre en español de México, con tono amigable, cálido y seguro.

CONTEXTO DE LA BÚSQUEDA:
- {tematica_str}
- Categorías encontradas: {cats_str}

CATÁLOGO DISPONIBLE PARA EL CLIENTE:
{context_str}

HISTORIAL DE LA CONVERSACIÓN:
{history_str}

MENSAJE DEL USUARIO:
{request.message}

REGLAS ESTRICTAS DE REDACCIÓN (¡CRÍTICO!):
1. SÉ EXTREMADAMENTE BREVE. Tu mensaje NO DEBE exceder de 2 o 3 oraciones (máximo 40 palabras).
2. NUNCA menciones nombres exactos de productos, IDs ni precios en tu mensaje.
3. NO describas ni enlistes lo que encontraste (el usuario ya lo verá en las tarjetas visuales). 
4. Si hay temática, solo menciona rápido: "nuestros proveedores lo personalizarán para tu temática".
5. Sé ASERTIVO y ve al grano: "¡Aquí te va el paquete!"
6. Responde ÚNICAMENTE con este JSON (sin formato markdown ```json):
   {{"action": "RECOMMENDATION", "content": "tu mensaje amigable y súper corto aquí"}}

EJEMPLO DE RESPUESTA IDEAL:
{{"action": "RECOMMENDATION", "content": "¡Padrísima la idea de dinosaurios! 🦖 Te armé este súper paquete con opciones de comida y mobiliario. Recuerda que nuestros proveedores adaptarán los detalles a tu temática. ¡Checa las tarjetas en tu pantalla!"}}
"""

        try:
            resp   = client_ai.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt_redactor,
            )
            raw    = resp.text.strip().replace("```json", "").replace("```", "").strip()
            # BLINDAJE JSON (CORREGIDO)
            raw = raw.replace("\n", "\\n").replace("\r", "")
            parsed = json.loads(raw, strict=False)
            
            action     = parsed.get("action", "RECOMMENDATION")
            ai_content = parsed.get("content", "¡Aquí tienes las mejores opciones para tu evento!")
        except Exception as e:
            print(f"⚠️  Error en Gemini redactor: {e}")
            action     = "RECOMMENDATION"
            ai_content = (
                "¡Aquí tienes opciones perfectas para tu evento! "
                "Las he seleccionado especialmente para ti."
            )

        final_response = AnalyzeResponse(
            action=action,
            content=ai_content,
            entities={"recommendations": unique_recommendations},
        )

        if not request.history:
            response_cache[cache_key] = final_response

        return final_response

    except Exception as e:
        print(f"❌ Error fatal en /analyze: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# PUNTO DE ENTRADA
# ============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)