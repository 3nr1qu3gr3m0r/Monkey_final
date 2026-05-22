import os
import json
import chromadb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from pathlib import Path
from google import genai
from dotenv import load_dotenv
import unicodedata

load_dotenv()

os.environ["CHROMA_TELEMETRY_DISABLED"] = "1"
os.environ["ANONYMIZED_TELEMETRY"] = "False"

app = FastAPI(title="MonkeyMarket AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

google_api_key = os.getenv("GOOGLE_API_KEY")
client_ai = genai.Client(api_key=google_api_key) if google_api_key else None

DB_PATH = Path(__file__).parent / "chroma_db"
chroma_client = chromadb.PersistentClient(path=str(DB_PATH))
COLLECTION_NAME = "monkeymarket_catalog"

response_cache: Dict[str, Any] = {}
embedder = None # Lo cargamos perezosamente (Lazy Loading)

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

def normalizar_texto(texto: str) -> str:
    texto = texto.lower().strip()
    return ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')

# Cargamos el modelo local solo cuando se necesita para ahorrar RAM al inicio
def get_embedder():
    global embedder
    if embedder is None:
        print("Cargando modelo local en RAM por primera vez...")
        from sentence_transformers import SentenceTransformer
        embedder = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    return embedder

def clasificar_intencion_con_gemini(mensaje: str, historial: List[Message]) -> Dict[str, Any]:
    if not client_ai:
        return {"categorias_detectadas": [], "tematica": None, "query_optimizada": mensaje, "tiene_suficiente_contexto": True}

    historial_str = "\n".join([f"{msg.role}: {msg.content}" for msg in historial[-3:]]) if historial else "Sin historial."

    prompt = f"""
Eres un clasificador de intenciones para un marketplace de eventos en México.
Analiza el mensaje y devuelve UNICAMENTE un JSON estructurado.
HISTORIAL RECIENTE: {historial_str}
MENSAJE ACTUAL DEL USUARIO: "{mensaje}"
RESPONDE ÚNICAMENTE CON ESTE FORMATO JSON:
{{
  "categorias_detectadas": [], 
  "tematica": "temática de fiesta detectada o null",
  "query_optimizada": "query limpia corregida ortográficamente",
  "tiene_suficiente_contexto": true
}}
"""
    try:
        response = client_ai.models.generate_content(model='gemini-2.5-flash', contents=prompt)
        raw = response.text.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(raw, strict=False)
    except Exception:
        return {"categorias_detectadas": [], "tematica": None, "query_optimizada": mensaje, "tiene_suficiente_contexto": True}

@app.get("/health")
async def health_check():
    return {"status": "ok", "gemini": client_ai is not None}

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_message(request: AnalyzeRequest):
    if not client_ai:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY no configurada.")

    try:
        cache_key = request.message.strip().lower()
        if cache_key in response_cache and not request.history:
            return response_cache[cache_key]

        clasificacion = clasificar_intencion_con_gemini(request.message, request.history)

        if not clasificacion.get("tiene_suficiente_contexto", True):
            return AnalyzeResponse(
                action="QUESTION",
                content="¡Hola! Con gusto te ayudo. ¿Me cuentas más sobre tu evento y qué servicios buscas?",
                entities={"recommendations": []}
            )

        query_limpia = clasificacion.get("query_optimizada", request.message)
        
        # Obtenemos el vector de la pregunta usando el modelo local
        local_embedder = get_embedder()
        query_embedding = local_embedder.encode(normalizar_texto(query_limpia)).tolist()

        collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)

        res = collection.query(query_embeddings=[query_embedding], n_results=10)
        
        grouped_by_category: Dict[str, List] = {}
        seen_names = set()

        if res.get('metadatas') and res['metadatas'][0]:
            for i, meta in enumerate(res['metadatas'][0]):
                nombre = meta.get("nombre", "Sin nombre")
                cat_label = "Recomendados"
                if nombre not in seen_names:
                    seen_names.add(nombre)
                    if cat_label not in grouped_by_category:
                        grouped_by_category[cat_label] = []
                    grouped_by_category[cat_label].append({
                        "id": res['ids'][0][i],
                        "nombre": nombre,
                        "precio": meta.get("precio", 0.0),
                        "tipo": meta.get("tipo", "Producto"),
                        "categoria": cat_label,
                    })

        unique_recommendations = []
        context_texts = []
        for cat in grouped_by_category:
            for item in grouped_by_category[cat][:12]:
                unique_recommendations.append(item)
                context_texts.append(f"- {item['nombre']} | Tipo: {item['tipo']}")

        if not unique_recommendations:
            return AnalyzeResponse(action="QUESTION", content="No encontré opciones exactas en el catálogo. ¿Buscamos algo diferente?", entities={"recommendations": []})

        context_str = "\n".join(context_texts)
        prompt_redactor = f"""
Eres un asistente mexicano de eventos para MonkeyMarket. Responde corto (máx 40 palabras).
No listes IDs ni precios. Sé asertivo.
CATÁLOGO ENCONTRADO: {context_str}
USUARIO: {request.message}
RESPONDE SÓLO ESTE JSON:
{{"action": "RECOMMENDATION", "content": "tu respuesta amigable aquí"}}
"""
        resp = client_ai.models.generate_content(model='gemini-2.5-flash', contents=prompt_redactor)
        raw = resp.text.strip().replace("```json", "").replace("```", "").strip()
        parsed = json.loads(raw, strict=False)

        final_response = AnalyzeResponse(
            action=parsed.get("action", "RECOMMENDATION"),
            content=parsed.get("content", "¡Aquí tienes las mejores opciones!"),
            entities={"recommendations": unique_recommendations}
        )

        if not request.history:
            response_cache[cache_key] = final_response

        return final_response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)