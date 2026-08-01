import logging
from typing import Dict, List, Optional
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Qdrant
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from qdrant_client import QdrantClient
import tiktoken

from config import settings
from openrouter_embeddings import OpenRouterEmbeddings

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
        # LAZY LOAD embeddings and LLM only when needed (to save memory on startup)
        self._embeddings = None
        self._llm = None
        self._llm_cache: Dict[str, object] = {}
        self._vector_store = None
        self.qdrant_client = None
        
        # Setup prompt template (lightweight, no memory impact)
        self.prompt_template = """You are a friendly and helpful AI customer support assistant. 
Use the following pieces of context to answer the user's questions about the business or documents. 
If the user asks a casual or conversational question (like "how are you?" or "hi"), you should answer warmly and politely, engaging in the conversation.
For specific business or technical questions where you don't know the answer based on the context, just say that you don't know, don't try to make up an answer.

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
        elif provider == "openrouter":
            if not settings.openrouter_api_key:
                raise ValueError("OpenRouter API key required for OpenRouter embeddings")
            logger.info(f"Using Custom OpenRouter embeddings: {settings.openrouter_embedding_model}")
            return OpenRouterEmbeddings(
                api_key=settings.openrouter_api_key,
                model=settings.openrouter_embedding_model
            )
        else:
            raise ValueError(f"Unknown embedding provider: {provider}")
    
    def _initialize_llm(self, model_override: Optional[str] = None, streaming: bool = False):
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
            
        elif provider == "openrouter":
            if not settings.openrouter_api_key:
                raise ValueError("OpenRouter API key required. Get one at https://openrouter.ai/keys")

            model_name = model_override or settings.openrouter_model
            logger.info(f"Using OpenRouter with model: {model_name} (streaming={streaming})")
            return ChatOpenAI(
                openai_api_key=settings.openrouter_api_key,
                openai_api_base="https://openrouter.ai/api/v1",
                model=model_name,
                temperature=settings.temperature,
                max_tokens=settings.max_tokens,
                streaming=streaming,
            )

        else:
            raise ValueError(f"Unknown LLM provider: {provider}. Choose: openai, groq, ollama, or openrouter")
    
    @property
    def embeddings(self):
        """Lazy load embeddings only when first accessed"""
        if self._embeddings is None:
            self._embeddings = self._initialize_embeddings()
        return self._embeddings
    
    @property
    def llm(self):
        """Lazy load default LLM only when first accessed"""
        if self._llm is None:
            self._llm = self._initialize_llm()
        return self._llm

    def _get_llm(self, model_override: Optional[str] = None, streaming: bool = False):
        """Get an LLM client for a given model/streaming combo, cached per combo."""
        cache_key = f"{model_override or 'default'}:{streaming}"
        if cache_key not in self._llm_cache:
            self._llm_cache[cache_key] = self._initialize_llm(
                model_override=model_override, streaming=streaming
            )
        return self._llm_cache[cache_key]

    def _active_model_name(self, model_override: Optional[str] = None) -> str:
        if settings.llm_provider == "openrouter":
            return model_override or settings.openrouter_model
        return settings.openai_model

    @property
    def vector_store(self):
        """Lazy load vector store only when first accessed"""
        if self._vector_store is None:
            self._initialize_vector_store()
        return self._vector_store
    
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
            
            self._vector_store = Qdrant(
                client=self.qdrant_client,
                collection_name=settings.qdrant_collection_name,
                embeddings=self.embeddings,  # This triggers lazy load
                content_payload_key=settings.qdrant_content_payload_key,
            )
    
    async def query(
        self,
        query: str,
        session_id: str,
        top_k: int = 5,
        model: Optional[str] = None,
    ) -> Dict:
        """
        Process a query through the RAG pipeline

        Args:
            query: User's question
            session_id: Session identifier
            top_k: Number of documents to retrieve
            model: Optional OpenRouter model id override for this request

        Returns:
            Dictionary with response, context, and metadata
        """
        try:
            logger.info(f"Processing query for session {session_id} with model={model or 'default'}")

            # Retrieve relevant documents
            retriever = self.vector_store.as_retriever(
                search_kwargs={"k": top_k}
            )

            # Create RetrievalQA chain
            qa_chain = RetrievalQA.from_chain_type(
                llm=self._get_llm(model_override=model),
                chain_type="stuff",
                retriever=retriever,
                chain_type_kwargs={"prompt": self.PROMPT},
                return_source_documents=True
            )

            # Run the chain
            result = qa_chain({"query": query})

            # Extract context from source documents
            context = [doc.page_content for doc in result.get("source_documents", [])]

            # Use simple character division for token approximation to avoid OpenAI/Tiktoken network calls
            tokens_used = self._estimate_tokens(query, result["result"], context)

            active_model = self._active_model_name(model)

            logger.info(f"Query processed successfully, {len(context)} context docs retrieved")

            return {
                "response": result["result"],
                "context": context,
                "model": active_model,
                "tokens_used": tokens_used
            }

        except Exception as e:
            logger.error(f"Error processing query: {e}")
            raise

    async def stream_query(
        self,
        query: str,
        session_id: str,
        top_k: int = 5,
        model: Optional[str] = None,
    ):
        """
        Process a query through the RAG pipeline, yielding response text chunks
        as they arrive, followed by a final dict with context/model/tokens metadata.

        Yields:
            str chunks of the response, then a single Dict as the last item
        """
        try:
            logger.info(f"Streaming query for session {session_id} with model={model or 'default'}")

            retriever = self.vector_store.as_retriever(search_kwargs={"k": top_k})
            source_docs = await retriever.ainvoke(query)
            context = [doc.page_content for doc in source_docs]

            prompt_text = self.PROMPT.format(
                context="\n\n".join(context),
                question=query,
            )

            llm = self._get_llm(model_override=model, streaming=True)

            full_response = ""
            async for chunk in llm.astream(prompt_text):
                token = chunk.content or ""
                if token:
                    full_response += token
                    yield token

            tokens_used = self._estimate_tokens(query, full_response, context)
            active_model = self._active_model_name(model)

            yield {
                "context": context,
                "model": active_model,
                "tokens_used": tokens_used,
            }

        except Exception as e:
            logger.error(f"Error streaming query: {e}")
            raise

    def _estimate_tokens(self, query: str, response: str, context: List[str]) -> int:
        """Estimate token usage using a simple character division to avoid external network calls."""
        try:
            # A rough estimate is 4 characters per token
            query_chars = len(query)
            response_chars = len(response)
            context_chars = sum(len(c) for c in context)
            
            total_chars = query_chars + response_chars + context_chars
            
            # Add overhead for prompt template (~100 tokens)
            total_tokens = (total_chars // 4) + 100
            
            return total_tokens
        except Exception as e:
            logger.warning(f"Could not estimate tokens: {e}")
            return 0
    
    def check_vector_db_health(self) -> bool:
        """Check if vector database is healthy"""
        try:
            if settings.vector_db == "qdrant":
                # Initialize client if not already done
                if not self.qdrant_client:
                    if settings.qdrant_api_key:
                        self.qdrant_client = QdrantClient(
                            url=settings.qdrant_url,
                            api_key=settings.qdrant_api_key
                        )
                    else:
                        self.qdrant_client = QdrantClient(url=settings.qdrant_url)
                
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
                # Initialize client if not already done
                if not self.qdrant_client:
                    if settings.qdrant_api_key:
                        self.qdrant_client = QdrantClient(
                            url=settings.qdrant_url,
                            api_key=settings.qdrant_api_key
                        )
                    else:
                        self.qdrant_client = QdrantClient(url=settings.qdrant_url)
                
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

