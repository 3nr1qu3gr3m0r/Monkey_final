# MonkeyMarket AI Service

This is the Python microservice that powers the AI functionality for MonkeyMarket.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the service:
```bash
python main.py
```

The service will:
- Load the product catalog from `../Sprint 5/dataset_limpio_monkeymarket.csv`
- Create embeddings using sentence-transformers
- Store them in a local Chroma vector database
- Provide semantic search via the `/analyze` endpoint

## API Endpoints

- `POST /analyze`: Analyze user messages and return product recommendations
- `GET /health`: Health check and product count

## Data Flow

1. On startup, the service ingests the CSV data into Chroma
2. When a user sends a message, it gets embedded and compared against the catalog
3. Similar products are returned as recommendations
4. The Node.js backend receives these recommendations and sends them to the frontend</content>
<parameter name="filePath">c:\Users\emili\OneDrive\Documentos\GitHub\MonkeyMarket\python_service\README.md