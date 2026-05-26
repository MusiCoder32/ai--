from setuptools import setup, find_packages

setup(
    name="exam-ai-backend",
    version="1.0.0",
    description="试卷AI答题系统 - 后端服务",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.100.0",
        "uvicorn>=0.23.0",
        "sqlalchemy>=2.0.0",
        "pillow>=10.0.0",
        "python-dotenv>=1.0.0",
        "python-multipart>=0.0.6",
    ],
    entry_points={
        "console_scripts": [
            "exam-ai-dev=uvicorn:main",
            "exam-ai-prod=uvicorn:main",
        ],
    },
)
