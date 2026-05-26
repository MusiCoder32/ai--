import requests
import json
from typing import Optional
from ..config import settings

llm_service = None

def get_llm_service():
    global llm_service
    if not llm_service:
        llm_service = LLMService()
    return llm_service

def process_chat_message(content: str, paper_id: Optional[str], user_id: str) -> str:
    service = get_llm_service()
    return service.generate_answer(content)

class LLMService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.base_url = settings.OPENAI_BASE_URL
    
    def generate_answer(self, question):
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        prompt = f"请回答以下问题：\n\n{question}\n\n请给出详细的解答和答案。"
        
        data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "你是一个聪明的答题助手，擅长解答各种类型的题目。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"].strip()
            else:
                return f"Error: {response.status_code}"
        except Exception as e:
            return f"Exception: {str(e)}"