import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # LLM Provider: "openai", "groq", "ollama"
    llm_provider: str = os.getenv("LLM_PROVIDER", "openai")
    
    # OpenAI
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4")
    
    # Groq (FREE!)
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_model: str = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")
    
    # Ollama (FREE, Local)
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3.1")
    
    # Embedding Provider: "openai", "huggingface"
    embedding_provider: str = os.getenv("EMBEDDING_PROVIDER", "openai")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    
    # HuggingFace Embeddings (FREE!)
    hf_embedding_model: str = os.getenv("HF_EMBEDDING_MODEL", "all-MiniLM-L6-v2")

    # Vector DB
    vector_db: str = os.getenv("VECTOR_DB", "qdrant")
    
    # Qdrant
    qdrant_url: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_api_key: str = os.getenv("QDRANT_API_KEY", "")
    qdrant_collection_name: str = os.getenv("QDRANT_COLLECTION_NAME", "customer_support_docs")
    
    # Pinecone
    pinecone_api_key: str = os.getenv("PINECONE_API_KEY", "")
    pinecone_environment: str = os.getenv("PINECONE_ENVIRONMENT", "")
    pinecone_index_name: str = os.getenv("PINECONE_INDEX_NAME", "customer-support")

    # RAG Settings
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k: int = 5
    temperature: float = 0.7
    max_tokens: int = 500

    # Server
    rag_service_port: int = int(os.getenv("RAG_SERVICE_PORT", "8000"))

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

