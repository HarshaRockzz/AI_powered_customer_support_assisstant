from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime

from config import settings
from ingest import DocumentIngestor
from query import RAGQueryEngine
from retrain import RetrainManager

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="AI Support Assistant - RAG Service",
    description="RAG microservice for document ingestion, query processing, and retraining",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
document_ingestor = DocumentIngestor()
query_engine = RAGQueryEngine()
retrain_manager = RetrainManager()


# Pydantic models
class QueryRequest(BaseModel):
    query: str
    session_id: str
    top_k: Optional[int] = 5


class QueryResponse(BaseModel):
    response: str
    context: List[str]
    model: str
    tokens_used: int


class IngestResponse(BaseModel):
    status: str
    chunk_count: int
    vector_store_id: str
    message: str


class RetrainRequest(BaseModel):
    feedback_threshold: Optional[int] = 10
    model_name: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str
    vector_db: str


# Routes
@app.get("/")
async def root():
    return {
        "service": "AI Support Assistant RAG Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            "/rag/ingest",
            "/rag/query",
            "/rag/retrain",
            "/health",
            "/docs"
        ]
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Check vector DB connection
        vector_db_status = query_engine.check_vector_db_health()
        
        return HealthResponse(
            status="healthy" if vector_db_status else "degraded",
            timestamp=datetime.utcnow(),
            version="1.0.0",
            vector_db=settings.vector_db
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.utcnow(),
            version="1.0.0",
            vector_db=settings.vector_db
        )


@app.post("/rag/ingest", response_model=IngestResponse)
async def ingest_document(file: UploadFile = File(...)):
    """
    Ingest a document into the vector database
    Supports: PDF, TXT, MD, CSV
    """
    try:
        logger.info(f"Ingesting document: {file.filename}")
        
        # Read file content
        content = await file.read()
        
        # Process and ingest document
        result = await document_ingestor.ingest(
            file_content=content,
            filename=file.filename,
            file_type=file.content_type
        )
        
        logger.info(f"Document ingested successfully: {result['chunk_count']} chunks")
        
        return IngestResponse(
            status="success",
            chunk_count=result["chunk_count"],
            vector_store_id=result["vector_store_id"],
            message=f"Document '{file.filename}' ingested successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to ingest document: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to ingest document: {str(e)}")


@app.post("/rag/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """
    Query the RAG system with a user question
    Retrieves relevant context and generates response
    """
    try:
        logger.info(f"Processing query: {request.query[:100]}...")
        
        # Process query through RAG pipeline
        result = await query_engine.query(
            query=request.query,
            session_id=request.session_id,
            top_k=request.top_k
        )
        
        logger.info(f"Query processed successfully, tokens used: {result['tokens_used']}")
        
        return QueryResponse(
            response=result["response"],
            context=result["context"],
            model=result["model"],
            tokens_used=result["tokens_used"]
        )
        
    except Exception as e:
        logger.error(f"Failed to process query: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process query: {str(e)}")


@app.post("/rag/retrain")
async def retrain_model(request: RetrainRequest):
    """
    Trigger model retraining based on feedback data
    Uses positive feedback samples for fine-tuning
    """
    try:
        logger.info("Starting model retraining...")
        
        result = await retrain_manager.retrain(
            feedback_threshold=request.feedback_threshold,
            model_name=request.model_name
        )
        
        logger.info(f"Retraining completed: {result}")
        
        return {
            "status": "success",
            "message": "Model retraining initiated",
            "details": result
        }
        
    except Exception as e:
        logger.error(f"Failed to retrain model: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrain model: {str(e)}")


@app.get("/rag/stats")
async def get_stats():
    """Get RAG service statistics"""
    try:
        stats = query_engine.get_stats()
        return stats
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=settings.rag_service_port,
        reload=True
    )

