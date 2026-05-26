import requests
import json
from ..config import settings

class OCRService:
    def __init__(self):
        self.api_key = settings.BAIDU_OCR_API_KEY
        self.secret_key = settings.BAIDU_OCR_SECRET_KEY
        self.token = None
    
    def get_access_token(self):
        url = "https://aip.baidubce.com/oauth/2.0/token"
        params = {
            "grant_type": "client_credentials",
            "client_id": self.api_key,
            "client_secret": self.secret_key
        }
        response = requests.post(url, params=params)
        if response.status_code == 200:
            self.token = response.json().get("access_token")
            return self.token
        return None
    
    def recognize_text(self, image_path):
        if not self.token:
            self.get_access_token()
        
        url = "https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic"
        with open(image_path, "rb") as f:
            image_data = f.read()
        
        params = {
            "image": image_data,
            "access_token": self.token
        }
        
        response = requests.post(url, files={"image": image_data}, params={"access_token": self.token})
        if response.status_code == 200:
            result = response.json()
            if "words_result" in result:
                return result["words_result"]
        return []