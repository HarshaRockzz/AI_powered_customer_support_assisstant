import logging
import asyncio
from typing import Dict, Optional, List
import json
from openai import OpenAI

from config import settings

logger = logging.getLogger(__name__)


class RetrainManager:
    """Manages model retraining and fine-tuning"""
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
    
    async def retrain(
        self,
        feedback_threshold: int = 10,
        model_name: Optional[str] = None
    ) -> Dict:
        """
        Retrain/fine-tune the model based on feedback
        
        Args:
            feedback_threshold: Minimum number of positive feedbacks to use
            model_name: Optional custom model name
        
        Returns:
            Dictionary with retraining results
        """
        try:
            logger.info("Starting retraining process...")
            
            # In a real implementation, you would:
            # 1. Fetch positive feedback samples from the backend database
            # 2. Format them into fine-tuning dataset
            # 3. Upload to OpenAI
            # 4. Start fine-tuning job
            # 5. Monitor and deploy when complete
            
            # For this demo, we'll simulate the process
            training_data = await self._collect_training_data(feedback_threshold)
            
            if len(training_data) < feedback_threshold:
                logger.warning(f"Not enough training data: {len(training_data)} samples")
                return {
                    "status": "skipped",
                    "reason": "insufficient_data",
                    "samples_collected": len(training_data),
                    "threshold": feedback_threshold
                }
            
            # Format for fine-tuning
            formatted_data = self._format_for_finetuning(training_data)
            
            # Create fine-tuning job (commented out for demo)
            # job_id = await self._create_finetuning_job(formatted_data, model_name)
            
            logger.info("Retraining process initiated")
            
            return {
                "status": "initiated",
                "samples_used": len(training_data),
                "message": "Retraining job created successfully"
                # "job_id": job_id
            }
            
        except Exception as e:
            logger.error(f"Retraining failed: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }
    
    async def _collect_training_data(self, min_samples: int) -> List[Dict]:
        """
        Collect training data from positive feedback
        In production, this would query the backend database
        """
        try:
            # Simulate collecting data
            # In real implementation: query backend API or database
            logger.info("Collecting training data from feedback...")
            
            # Mock data for demonstration
            training_samples = []
            
            # In production:
            # 1. Query backend for high-rated conversations
            # 2. Filter by feedback score >= 1
            # 3. Extract query-response pairs
            # 4. Add context if available
            
            return training_samples
            
        except Exception as e:
            logger.error(f"Failed to collect training data: {e}")
            return []
    
    def _format_for_finetuning(self, training_data: List[Dict]) -> List[Dict]:
        """Format training data for OpenAI fine-tuning"""
        formatted_data = []
        
        for sample in training_data:
            formatted_sample = {
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a helpful AI customer support assistant."
                    },
                    {
                        "role": "user",
                        "content": sample.get("query", "")
                    },
                    {
                        "role": "assistant",
                        "content": sample.get("response", "")
                    }
                ]
            }
            formatted_data.append(formatted_sample)
        
        return formatted_data
    
    async def _create_finetuning_job(
        self,
        training_data: List[Dict],
        model_name: Optional[str] = None
    ) -> str:
        """
        Create a fine-tuning job with OpenAI
        """
        try:
            # Save training data to JSONL file
            training_file_path = "/tmp/training_data.jsonl"
            with open(training_file_path, 'w') as f:
                for item in training_data:
                    f.write(json.dumps(item) + '\n')
            
            # Upload file to OpenAI
            with open(training_file_path, 'rb') as f:
                file_response = self.client.files.create(
                    file=f,
                    purpose='fine-tune'
                )
            
            # Create fine-tuning job
            job = self.client.fine_tuning.jobs.create(
                training_file=file_response.id,
                model=model_name or "gpt-3.5-turbo",
                hyperparameters={
                    "n_epochs": 3
                }
            )
            
            logger.info(f"Fine-tuning job created: {job.id}")
            return job.id
            
        except Exception as e:
            logger.error(f"Failed to create fine-tuning job: {e}")
            raise
    
    async def check_finetuning_status(self, job_id: str) -> Dict:
        """Check the status of a fine-tuning job"""
        try:
            job = self.client.fine_tuning.jobs.retrieve(job_id)
            
            return {
                "job_id": job.id,
                "status": job.status,
                "model": job.fine_tuned_model,
                "created_at": job.created_at,
                "finished_at": job.finished_at
            }
            
        except Exception as e:
            logger.error(f"Failed to check fine-tuning status: {e}")
            return {"status": "error", "error": str(e)}

