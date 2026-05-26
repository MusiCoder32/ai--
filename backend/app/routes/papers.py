from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import uuid4
from PIL import Image
import os

from app.config import settings
from app.db import get_db, ExamPaper, Question
from app.services.local_ocr_service import LocalOCRService
from app.services.llm_service import LLMService

router = APIRouter(prefix="/api/papers", tags=["papers"])

ocr_service = LocalOCRService(settings.TESSERACT_PATH if settings.TESSERACT_PATH else None)
llm_service = LLMService()


@router.post("/upload")
async def upload_paper(image: UploadFile = File(...), db: Session = Depends(get_db)):
    if not image.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        raise HTTPException(status_code=400, detail="INVALID_IMAGE: 只支持jpg和png格式")
    
    content = await image.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="FILE_TOO_LARGE: 图片大小不能超过10MB")
    
    file_id = str(uuid4())
    ext = image.filename.split('.')[-1]
    file_path = settings.UPLOAD_DIR / f"{file_id}.{ext}"
    with open(file_path, "wb") as f:
        f.write(content)
    
    img = Image.open(file_path)
    width, height = img.size
    
    paper = ExamPaper(
        id=str(uuid4()),
        user_id="test-user",
        original_image_url=f"/uploads/{file_id}.{ext}",
        width=width,
        height=height
    )
    db.add(paper)
    db.commit()
    
    return {"success": True, "data": {"paper_id": paper.id, "image_url": paper.original_image_url, "width": width, "height": height}}


@router.get("")
async def list_papers(db: Session = Depends(get_db)):
    papers = db.query(ExamPaper).all()
    result = []
    for p in papers:
        result.append({
            "id": p.id,
            "image_url": p.original_image_url,
            "status": p.status,
            "created_at": p.created_at
        })
    return {"success": True, "data": result}


@router.get("/{paper_id}")
async def get_paper(paper_id: str, db: Session = Depends(get_db)):
    paper = db.query(ExamPaper).filter(ExamPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="PAPER_NOT_FOUND")
    
    questions = db.query(Question).filter(Question.paper_id == paper_id).order_by(Question.order).all()
    questions_data = []
    for q in questions:
        questions_data.append({
            "id": q.id,
            "content": q.content,
            "ai_answer": q.ai_answer,
            "user_answer": q.user_answer,
            "x": q.x,
            "y": q.y,
            "width": q.width,
            "height": q.height,
            "answer_x": q.answer_x,
            "answer_y": q.answer_y,
            "answer_width": q.answer_width,
            "answer_height": q.answer_height,
            "font_color": q.font_color,
            "font_size": q.font_size,
            "order": q.order
        })
    
    return {
        "success": True,
        "data": {
            "id": paper.id,
            "original_image_url": paper.original_image_url,
            "width": paper.width,
            "height": paper.height,
            "status": paper.status,
            "questions": questions_data
        }
    }


@router.post("/{paper_id}/ocr")
async def run_ocr(paper_id: str, db: Session = Depends(get_db)):
    paper = db.query(ExamPaper).filter(ExamPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="PAPER_NOT_FOUND")
    
    image_path = str(settings.UPLOAD_DIR / os.path.basename(paper.original_image_url))
    
    try:
        result = ocr_service.recognize_text(image_path, lang=settings.OCR_LANGUAGES)
        
        if not result:
            return {"success": False, "message": "OCR识别失败，未检测到文字"}
        
        questions = []
        grouped = {}
        
        for item in result:
            y_key = item['top'] // 30
            if y_key not in grouped:
                grouped[y_key] = []
            grouped[y_key].append(item)
        
        for y_key in sorted(grouped.keys()):
            group = grouped[y_key]
            group.sort(key=lambda x: x['left'])
            
            content = ' '.join([item['words'] for item in group])
            min_x = min(item['left'] for item in group)
            min_y = min(item['top'] for item in group)
            max_x = max(item['left'] + item['width'] for item in group)
            max_y = max(item['top'] + item['height'] for item in group)
            
            questions.append({
                "content": content,
                "x": min_x,
                "y": min_y,
                "width": max_x - min_x,
                "height": max_y - min_y
            })
        
        db.query(Question).filter(Question.paper_id == paper_id).delete()
        
        for i, q in enumerate(questions):
            question = Question(
                id=str(uuid4()),
                paper_id=paper_id,
                content=q['content'],
                x=q['x'],
                y=q['y'],
                width=q['width'],
                height=q['height'],
                answer_x=q['x'],
                answer_y=q['y'] + q['height'] + 10,
                answer_width=q['width'],
                answer_height=100,
                order=i + 1
            )
            db.add(question)
        
        paper.status = "ocr_done"
        db.commit()
        
        questions_data = []
        for i, q in enumerate(questions):
            questions_data.append({
                "id": str(uuid4()),
                "content": q['content'],
                "x": q['x'],
                "y": q['y'],
                "width": q['width'],
                "height": q['height'],
                "order": i + 1
            })
        
        return {"success": True, "data": questions_data}
    
    except Exception as e:
        return {"success": False, "message": f"OCR识别失败: {str(e)}"}


@router.post("/{paper_id}/answer")
async def generate_answers(paper_id: str, db: Session = Depends(get_db)):
    paper = db.query(ExamPaper).filter(ExamPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="PAPER_NOT_FOUND")
    
    questions = db.query(Question).filter(Question.paper_id == paper_id).order_by(Question.order).all()
    
    if not questions:
        return {"success": False, "message": "没有可处理的题目"}
    
    try:
        for question in questions:
            if question.content.strip():
                answer = llm_service.generate_answer(question.content)
                question.ai_answer = answer
        
        paper.status = "answered"
        db.commit()
        
        questions_data = []
        for q in questions:
            questions_data.append({
                "id": q.id,
                "content": q.content,
                "ai_answer": q.ai_answer,
                "order": q.order
            })
        
        return {"success": True, "data": questions_data}
    
    except Exception as e:
        return {"success": False, "message": f"答案生成失败: {str(e)}"}