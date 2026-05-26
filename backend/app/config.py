from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # 服务配置
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # 测试模式配置
    TEST_MODE: bool = True  # 测试模式：固定答复，不调用真实LLM
    
    # 数据库配置
    DATABASE_URL: str = "sqlite:///./exam.db"
    
    # OCR配置
    OCR_MODE: str = "local"  # local 或 cloud
    TESSERACT_PATH: str = ""  # Tesseract可执行文件路径（Windows需要）
    OCR_LANGUAGES: str = "chi_sim+eng"  # 识别语言
    
    # 备用：云OCR配置
    BAIDU_OCR_API_KEY: str = ""
    BAIDU_OCR_SECRET_KEY: str = ""
    
    # LLM配置
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    
    # 图片存储
    UPLOAD_DIR: Path = Path("./uploads")
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # 安全配置
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"

settings = Settings()

# 确保上传目录存在
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)