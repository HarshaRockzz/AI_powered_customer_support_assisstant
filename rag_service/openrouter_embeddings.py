import logging
from typing import List
import requests
from langchain_core.embeddings import Embeddings

logger = logging.getLogger(__name__)

class OpenRouterEmbeddings(Embeddings):
    """Custom embedding class for OpenRouter to handle specific payload quirks."""
    
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
        self.url = "https://openrouter.ai/api/v1/embeddings"
        
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        logger.info(f"Generating embeddings for {len(texts)} documents using {self.model}")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": self.model,
            "input": texts
        }
        
        response = requests.post(self.url, headers=headers, json=data)
        
        if response.status_code != 200:
            logger.error(f"OpenRouter API error {response.status_code}: {response.text}")
            raise ValueError(f"OpenRouter API returned status {response.status_code}")
            
        res_json = response.json()
        
        if "data" not in res_json or not res_json["data"]:
            logger.error(f"Invalid OpenRouter response: {res_json}")
            raise ValueError(f"No embedding data received from OpenRouter. Response: {res_json}")
            
        sorted_data = sorted(res_json["data"], key=lambda x: x.get("index", 0))
        return [item["embedding"] for item in sorted_data]

    def embed_query(self, text: str) -> List[float]:
        return self.embed_documents([text])[0]
