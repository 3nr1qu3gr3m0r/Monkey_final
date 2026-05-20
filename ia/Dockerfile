# 1. Usar una versión de Python estable y ligera
FROM python:3.11-slim

# 2. Instalar herramientas base que a veces necesita ChromaDB
RUN apt-get update && apt-get install -y gcc g++ build-essential

# 3. Crear nuestra carpeta de trabajo
WORKDIR /app

# 4. Copiar primero las dependencias
COPY requirements.txt .

# 5. EL TRUCO MAESTRO: Instalar PyTorch versión ligera (CPU) primero
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 6. Instalar el resto de tus librerías (FastAPI, Gemini, Chroma, etc.)
RUN pip install --no-cache-dir -r requirements.txt

# 7. Copiar el resto de tu código
COPY . .

# 8. El comando de arranque (Railway inyecta el puerto automáticamente)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}