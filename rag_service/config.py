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
    ollama_base_url: str = os.getenv(
        "OLLAMA_BASE_URL", "http://host.docker.internal:11434"
    )
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3.1")

    # OpenRouter
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    # gemma-4-31b-it:free hits upstream 429s often; gpt-oss-20b:free is more reliable.
    openrouter_model: str = os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-20b:free")
    # nvidia/llama-nemotron-embed-vl-1b-v2:free is a live free OpenRouter embedding
    # model (2048-dim) — used when EMBEDDING_PROVIDER=openrouter.
    openrouter_embedding_model: str = os.getenv(
        "OPENROUTER_EMBEDDING_MODEL", "nvidia/llama-nemotron-embed-vl-1b-v2:free"
    )

    # Free OpenRouter chat models available for the frontend model picker.
    # Verified live against https://openrouter.ai/api/v1/models.
    openrouter_free_models: list = [
        {
            "id": "openai/gpt-oss-20b:free",
            "label": "GPT-OSS 20B",
            "context_length": 131072,
        },
        {
            "id": "google/gemma-4-31b-it:free",
            "label": "Gemma 4 31B",
            "context_length": 262144,
        },
        {
            "id": "google/gemma-4-26b-a4b-it:free",
            "label": "Gemma 4 26B",
            "context_length": 262144,
        },
        {
            "id": "nvidia/nemotron-3-super-120b-a12b:free",
            "label": "Nemotron 3 Super 120B",
            "context_length": 262144,
        },
        {
            "id": "nvidia/nemotron-3-nano-30b-a3b:free",
            "label": "Nemotron 3 Nano 30B",
            "context_length": 256000,
        },
        {
            "id": "nvidia/nemotron-3-ultra-550b-a55b:free",
            "label": "Nemotron 3 Ultra 550B",
            "context_length": 1000000,
        },
        {
            "id": "nvidia/nemotron-nano-9b-v2:free",
            "label": "Nemotron Nano 9B",
            "context_length": 128000,
        },
        {
            "id": "inclusionai/ling-3.0-flash:free",
            "label": "Ling 3.0 Flash",
            "context_length": 262144,
        },
        {
            "id": "cohere/north-mini-code:free",
            "label": "North Mini Code",
            "context_length": 256000,
        },
        {
            "id": "poolside/laguna-s-2.1:free",
            "label": "Laguna S 2.1",
            "context_length": 262144,
        },
        {
            "id": "poolside/laguna-xs-2.1:free",
            "label": "Laguna XS 2.1",
            "context_length": 262144,
        },
    ]

    # Embedding Provider: "openai", "huggingface", "openrouter"
    embedding_provider: str = os.getenv("EMBEDDING_PROVIDER", "openrouter")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

    # HuggingFace Embeddings (FREE!)
    hf_embedding_model: str = os.getenv("HF_EMBEDDING_MODEL", "all-MiniLM-L6-v2")

    # Vector DB
    vector_db: str = os.getenv("VECTOR_DB", "qdrant")

    # Qdrant
    qdrant_url: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_api_key: str = os.getenv("QDRANT_API_KEY", "")
    qdrant_collection_name: str = os.getenv(
        "QDRANT_COLLECTION_NAME", "customer_support_docs"
    )
    # Payload field holding the chunk text. LangChain's Qdrant wrapper defaults to
    # "page_content"; the security_knowledge_base collection stores it as "text".
    qdrant_content_payload_key: str = os.getenv(
        "QDRANT_CONTENT_PAYLOAD_KEY", "page_content"
    )

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
