import io
import logging
from typing import Dict, List
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Qdrant
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import uuid

from config import settings

logger = logging.getLogger(__name__)


class DocumentIngestor:
    """Handles document ingestion into vector database"""
    
    def __init__(self):
        # Initialize embeddings based on provider
        self.embeddings = self._initialize_embeddings()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            length_function=len,
        )
        
        # Initialize vector store
        if settings.vector_db == "qdrant":
            # Connect to Qdrant (supports both local and Qdrant Cloud)
            if settings.qdrant_api_key:
                self.qdrant_client = QdrantClient(
                    url=settings.qdrant_url,
                    api_key=settings.qdrant_api_key
                )
            else:
                self.qdrant_client = QdrantClient(url=settings.qdrant_url)
            self._ensure_collection_exists()
        elif settings.vector_db == "pinecone":
            # Initialize Pinecone if needed
            pass
    
    def _initialize_embeddings(self):
        """Initialize embeddings based on provider"""
        provider = settings.embedding_provider.lower()
        
        logger.info(f"Initializing embeddings with provider: {provider}")
        
        if provider == "openai":
            if not settings.openai_api_key:
                raise ValueError("OpenAI API key required for OpenAI embeddings")
            return OpenAIEmbeddings(
                openai_api_key=settings.openai_api_key,
                model=settings.embedding_model
            )
        elif provider == "huggingface":
            logger.info(f"Using FREE HuggingFace embeddings: {settings.hf_embedding_model}")
            return HuggingFaceEmbeddings(
                model_name=settings.hf_embedding_model
            )
        else:
            raise ValueError(f"Unknown embedding provider: {provider}")
    
    def _ensure_collection_exists(self):
        """Ensure Qdrant collection exists"""
        try:
            collections = self.qdrant_client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if settings.qdrant_collection_name not in collection_names:
                # Determine vector size based on embedding provider
                if settings.embedding_provider == "openai":
                    vector_size = 1536  # OpenAI embedding size
                elif settings.embedding_provider == "huggingface":
                    vector_size = 384   # all-MiniLM-L6-v2 size
                else:
                    vector_size = 1536  # default
                
                logger.info(f"Creating collection: {settings.qdrant_collection_name} with vector size: {vector_size}")
                self.qdrant_client.create_collection(
                    collection_name=settings.qdrant_collection_name,
                    vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
                )
        except Exception as e:
            logger.error(f"Failed to ensure collection exists: {e}")
    
    async def ingest(
        self,
        file_content: bytes,
        filename: str,
        file_type: str
    ) -> Dict:
        """
        Ingest a document into the vector store
        
        Args:
            file_content: Raw file bytes
            filename: Name of the file
            file_type: MIME type of the file
        
        Returns:
            Dictionary with ingestion results
        """
        try:
            # Extract text from file
            text = self._extract_text(file_content, filename, file_type)
            
            if not text or len(text.strip()) == 0:
                raise ValueError("No text could be extracted from the document")
            
            # Split text into chunks
            chunks = self.text_splitter.split_text(text)
            logger.info(f"Split document into {len(chunks)} chunks")
            
            # Generate unique ID for this document
            doc_id = str(uuid.uuid4())
            
            # Create metadata for chunks
            metadatas = [
                {
                    "source": filename,
                    "doc_id": doc_id,
                    "chunk_index": i,
                    "total_chunks": len(chunks)
                }
                for i in range(len(chunks))
            ]
            
            # Store in vector database
            if settings.vector_db == "qdrant":
                vector_store = Qdrant(
                    client=self.qdrant_client,
                    collection_name=settings.qdrant_collection_name,
                    embeddings=self.embeddings
                )
                vector_store.add_texts(texts=chunks, metadatas=metadatas)
            
            logger.info(f"Successfully ingested {len(chunks)} chunks for {filename}")
            
            return {
                "chunk_count": len(chunks),
                "vector_store_id": doc_id,
                "filename": filename
            }
            
        except Exception as e:
            logger.error(f"Error ingesting document: {e}")
            raise
    
    def _extract_text(self, file_content: bytes, filename: str, file_type: str) -> str:
        """Extract text from different file types"""
        try:
            filename_lower = filename.lower()
            
            # PDF files
            if filename_lower.endswith('.pdf') or 'pdf' in file_type:
                return self._extract_from_pdf(file_content)
            
            # Text files
            elif filename_lower.endswith(('.txt', '.md', '.markdown', '.csv')):
                return file_content.decode('utf-8')
            
            else:
                # Try to decode as text
                try:
                    return file_content.decode('utf-8')
                except:
                    raise ValueError(f"Unsupported file type: {file_type}")
                    
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            raise
    
    def _extract_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF"""
        try:
            pdf_file = io.BytesIO(file_content)
            pdf_reader = PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text
        except Exception as e:
            logger.error(f"Error extracting from PDF: {e}")
            raise

