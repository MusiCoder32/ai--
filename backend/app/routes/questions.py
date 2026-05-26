from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db import get_db, Question

router = APIRouter(prefix="/api/questions", tags=["questions"])


@router.put("/{question_id}")
async def update_question(question_id: str, db: Session = Depends(get_db), **kwargs):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="QUESTION_NOT_FOUND")
    
    allowed_fields = ['content', 'user_answer', 'font_color', 'font_size', 'x', 'y', 'width', 'height', 'answer_x', 'answer_y', 'answer_width', 'answer_height']
    
    for key, value in kwargs.items():
        if key in allowed_fields and hasattr(question, key):
            setattr(question, key, value)
    
    db.commit()
    
    return {"success": True, "data": {
        "id": question.id,
        "content": question.content,
        "ai_answer": question.ai_answer,
        "user_answer": question.user_answer,
        "font_color": question.font_color,
        "font_size": question.font_size
    }}


@router.delete("/{question_id}")
async def delete_question(question_id: str, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="QUESTION_NOT_FOUND")
    
    paper_id = question.paper_id
    db.delete(question)
    db.commit()
    
    questions = db.query(Question).filter(Question.paper_id == paper_id).order_by(Question.order).all()
    for i, q in enumerate(questions):
        q.order = i + 1
    db.commit()
    
    return {"success": True, "data": None}