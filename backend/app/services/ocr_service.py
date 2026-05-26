import requests
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

    def _ensure_token(self):
        if not self.token:
            self.get_access_token()
        return self.token
    
    def recognize_text(self, image_path):
        if not self._ensure_token():
            return []

        url = "https://aip.baidubce.com/rest/2.0/ocr/v1/general"
        with open(image_path, "rb") as f:
            image_data = f.read()

        response = requests.post(
            url,
            files={"image": image_data},
            params={"access_token": self.token},
            data={"paragraph": "false"}
        )
        if response.status_code != 200:
            return []

        result = response.json()
        words_result = result.get("words_result", [])
        normalized = []
        for item in words_result:
            location = item.get("location", {})
            normalized.append({
                "words": item.get("words", ""),
                "left": location.get("left", 0),
                "top": location.get("top", 0),
                "width": location.get("width", 0),
                "height": location.get("height", 0)
            })
        return normalized