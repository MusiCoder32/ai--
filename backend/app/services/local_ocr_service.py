import cv2
import numpy as np
import pytesseract
from PIL import Image
from typing import List, Dict, Optional

class LocalOCRService:
    def __init__(self, tesseract_path: Optional[str] = None):
        if tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """图片预处理：降噪、二值化、倾斜校正"""
        image = cv2.imread(image_path)
        
        if image is None:
            raise ValueError("无法读取图片文件")
        
        # 转为灰度图
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 自适应阈值二值化
        thresh = cv2.adaptiveThreshold(
            gray, 255, 
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 
            11, 2
        )
        
        # 去除噪声
        kernel = np.ones((1, 1), np.uint8)
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
        
        # 反转颜色（Tesseract喜欢白底黑字）
        result = 255 - cleaned
        
        return result
    
    def recognize_text(self, image_path: str, lang: str = "chi_sim+eng") -> List[Dict]:
        """识别图片中的文字，返回带位置信息的结果"""
        try:
            # 预处理图片
            processed = self.preprocess_image(image_path)
            
            # 使用Tesseract识别，获取详细数据
            d = pytesseract.image_to_data(
                processed, 
                lang=lang,
                output_type=pytesseract.Output.DICT
            )
            
            # 整理结果
            result = []
            n_boxes = len(d['text'])
            
            for i in range(n_boxes):
                # 过滤置信度低的结果
                conf = int(d['conf'][i])
                if conf < 60:
                    continue
                
                text = d['text'][i].strip()
                if not text:
                    continue
                
                result.append({
                    "words": text,
                    "left": d['left'][i],
                    "top": d['top'][i],
                    "width": d['width'][i],
                    "height": d['height'][i],
                    "confidence": conf
                })
            
            return result
            
        except Exception as e:
            print(f"OCR识别失败: {str(e)}")
            return []
    
    def recognize_text_simple(self, image_path: str, lang: str = "chi_sim+eng") -> str:
        """简单识别，只返回文字内容"""
        try:
            processed = self.preprocess_image(image_path)
            text = pytesseract.image_to_string(processed, lang=lang)
            return text.strip()
        except Exception as e:
            print(f"OCR识别失败: {str(e)}")
            return ""

# 使用示例
if __name__ == "__main__":
    ocr = LocalOCRService()
    
    # Windows 用户需要指定路径
    # ocr = LocalOCRService(r"C:\Program Files\Tesseract-OCR\tesseract.exe")
    
    result = ocr.recognize_text("test.jpg")
    for item in result:
        print(f"文字: {item['words']}, 位置: ({item['left']}, {item['top']})")