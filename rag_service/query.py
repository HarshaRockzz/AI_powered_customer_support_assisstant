import logging
from typing import Dict, List
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Qdrant
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from qdrant_client import QdrantClient
import tiktoken

from config import settings

# Import free providers
try:
    from langchain_groq import ChatGroq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    logging.warning("Groq not installed. Install with: pip install langchain-groq")

try:
    from langchain_community.llms import Ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False

logger = logging.getLogger(__name__)


class RAGQueryEngine:
    """Handles RAG query processing"""
    
    def __init__(self):
        # Initialize embeddings based on provider
        self.embeddings = self._initialize_embeddings()
        
        # Initialize LLM based on provider
        self.llm = self._initialize_llm()
        
        # Initialize vector store
        self._initialize_vector_store()
        
        # Custom prompt template
        self.prompt_template = """You are an AI customer support assistant. Use the following pieces of context to answer the question at the end. 
If you don't know the answer based on the context, just say that you don't know, don't try to make up an answer.

Context:
{context}

Question: {question}

Helpful Answer:"""
        
        self.PROMPT = PromptTemplate(
            template=self.prompt_template,
            input_variables=["context", "question"]
        )
    
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
            logger.info(f"Using HuggingFace embeddings: {settings.hf_embedding_model}")
            return HuggingFaceEmbeddings(
                model_name=settings.hf_embedding_model
            )
        else:
            raise ValueError(f"Unknown embedding provider: {provider}")
    
    def _initialize_llm(self):
        """Initialize LLM based on provider"""
        provider = settings.llm_provider.lower()
        
        logger.info(f"Initializing LLM with provider: {provider}")
        
        if provider == "openai":
            if not settings.openai_api_key:
                raise ValueError("OpenAI API key required. Get one at https://platform.openai.com/api-keys")
            return ChatOpenAI(
                openai_api_key=settings.openai_api_key,
                model=settings.openai_model,
                temperature=settings.temperature,
                max_tokens=settings.max_tokens
            )
        
        elif provider == "groq":
            if not GROQ_AVAILABLE:
                raise ValueError("Groq not installed. Run: pip install langchain-groq")
            if not settings.groq_api_key:
                raise ValueError("Groq API key required. Get FREE key at https://console.groq.com")
            
            logger.info(f"Using Groq with model: {settings.groq_model}")
            return ChatGroq(
                groq_api_key=settings.groq_api_key,
                model_name=settings.groq_model,
                temperature=settings.temperature,
                max_tokens=settings.max_tokens
            )
        
        elif provider == "ollama":
            if not OLLAMA_AVAILABLE:
                raise ValueError("Ollama support not available")
            
            logger.info(f"Using Ollama at {settings.ollama_base_url} with model: {settings.ollama_model}")
            return Ollama(
                base_url=settings.ollama_base_url,
                model=settings.ollama_model,
                temperature=settings.temperature
            )
        
        else:
            raise ValueError(f"Unknown LLM provider: {provider}. Choose: openai, groq, or ollama")
    
    def _initialize_vector_store(self):
        """Initialize vector store"""
        if settings.vector_db == "qdrant":
            # Connect to Qdrant (supports both local and Qdrant Cloud)
            if settings.qdrant_api_key:
                self.qdrant_client = QdrantClient(
                    url=settings.qdrant_url,
                    api_key=settings.qdrant_api_key
                )
            else:
                self.qdrant_client = QdrantClient(url=settings.qdrant_url)
            
            self.vector_store = Qdrant(
                client=self.qdrant_client,
                collection_name=settings.qdrant_collection_name,
                embeddings=self.embeddings
            )
    
    async def query(
        self,
        query: str,
        session_id: str,
        top_k: int = 5
    ) -> Dict:
        """
        Process a query through the RAG pipeline
        
        Args:
            query: User's question
            session_id: Session identifier
            top_k: Number of documents to retrieve
        
        Returns:
            Dictionary with response, context, and metadata
        """
        try:
            logger.info(f"Processing query for session {session_id}")
            
            # Retrieve relevant documents
            retriever = self.vector_store.as_retriever(
                search_kwargs={"k": top_k}
            )
            
            # Create RetrievalQA chain
            qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=retriever,
                chain_type_kwargs={"prompt": self.PROMPT},
                return_source_documents=True
            )
            
            # Run the chain
            result = qa_chain({"query": query})
            
            # Extract context from source documents
            context = [doc.page_content for doc in result.get("source_documents", [])]
            
            # Calculate tokens used (approximation)
            tokens_used = self._estimate_tokens(query, result["result"], context)
            
            logger.info(f"Query processed successfully, {len(context)} context docs retrieved")
            
            return {
                "response": result["result"],
                "context": context,
                "model": settings.openai_model,
                "tokens_used": tokens_used
            }
            
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            raise
    
    def _estimate_tokens(self, query: str, response: str, context: List[str]) -> int:
        """Estimate token usage"""
        try:
            encoding = tiktoken.encoding_for_model(settings.openai_model)
            
            query_tokens = len(encoding.encode(query))
            response_tokens = len(encoding.encode(response))
            context_tokens = sum(len(encoding.encode(c)) for c in context)
            
            # Add overhead for prompt template
            total_tokens = query_tokens + response_tokens + context_tokens + 100
            
            return total_tokens
        except Exception as e:
            logger.warning(f"Could not estimate tokens: {e}")
            return 0
    
    def check_vector_db_health(self) -> bool:
        """Check if vector database is healthy"""
        try:
            if settings.vector_db == "qdrant":
                collections = self.qdrant_client.get_collections()
                return True
            return True
        except Exception as e:
            logger.error(f"Vector DB health check failed: {e}")
            return False
    
    def get_stats(self) -> Dict:
        """Get statistics about the vector store"""
        try:
            if settings.vector_db == "qdrant":
                collection_info = self.qdrant_client.get_collection(
                    collection_name=settings.qdrant_collection_name
                )
                return {
                    "vector_db": settings.vector_db,
                    "collection": settings.qdrant_collection_name,
                    "vectors_count": collection_info.vectors_count,
                    "status": "healthy"
                }
            return {"status": "unknown"}
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {"status": "error", "message": str(e)}

