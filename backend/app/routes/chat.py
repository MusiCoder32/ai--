import asyncio
from uuid import uuid4
from typing import Optional, Union, AsyncGenerator
from fastapi import APIRouter, Depends, Query, HTTPException, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db import get_db, ChatMessage, User
from app.services.llm_service import process_chat_message
from app.config import settings
from pydantic import BaseModel

router = APIRouter(prefix="/api/chat", tags=["chat"])

TEST_RESPONSE = """
这是测试模式下的固定答复。

试卷AI答题系统功能介绍：

1. **OCR识别** - 支持中英文混合识别，自动处理试卷图片

2. **智能答题** - 基于深度学习的自动答题能力

3. **历史记录** - 自动保存答题记录，支持随时查阅

4. **试卷管理** - 支持多试卷管理，批量处理

系统采用先进的NLP技术，能够理解并回答各种学科问题。
""".strip()

async def get_current_user(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
) -> dict:
    """获取当前用户（简化版，演示用）"""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        pass
    
    user = db.query(User).first()
    if user:
        return {"id": user.id, "username": user.username}
    
    return {"id": "demo-user-id", "username": "demo"}


class ChatMessageRequest(BaseModel):
    content: str
    paper_id: Optional[str] = None


class ChatResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    message: Optional[str] = None


@router.get("/history")
async def get_chat_history(
    paper_id: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    query = db.query(ChatMessage).filter(ChatMessage.user_id == user["id"])
    
    if paper_id:
        query = query.filter(ChatMessage.paper_id == paper_id)
    
    messages = query.order_by(ChatMessage.created_at.desc()) \
                     .offset(offset) \
                     .limit(limit) \
                     .all()
    
    result = []
    for msg in messages:
        result.append({
            "message_id": msg.id,
            "content": msg.content,
            "role": msg.role,
            "paper_id": msg.paper_id,
            "created_at": msg.created_at.isoformat()
        })
    
    return {"success": True, "data": result}


async def generate_streaming_response(content: str) -> AsyncGenerator[str, None]:
    """流式响应生成器 - 模拟打字机效果"""
    words = content.split()
    current_length = 0
    
    for i, word in enumerate(words):
        if i > 0:
            word = ' ' + word
        
        # 每个单词作为一个 SSE 数据块
        yield f"data: {word}\n\n"
        current_length += len(word)
        
        # 根据内容长度调整延迟，模拟真实打字速度
        delay = max(20, 80 - current_length // 5)
        await asyncio.sleep(delay / 1000)
        
        # 每5个词后添加稍长的停顿
        if (i + 1) % 5 == 0:
            await asyncio.sleep(0.15)


@router.post("/message")
async def send_chat_message(
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    user_message = ChatMessage(
        id=str(uuid4()),
        user_id=user["id"],
        content=request.content,
        role="user",
        paper_id=request.paper_id
    )
    db.add(user_message)
    
    if settings.TEST_MODE:
        ai_response = TEST_RESPONSE
    else:
        ai_response = process_chat_message(request.content, request.paper_id, user["id"])
    
    assistant_message = ChatMessage(
        id=str(uuid4()),
        user_id=user["id"],
        content=ai_response,
        role="assistant",
        paper_id=request.paper_id
    )
    db.add(assistant_message)
    db.commit()
    
    return {
        "success": True,
        "data": {
            "user_message_id": user_message.id,
            "assistant_message_id": assistant_message.id,
            "content": ai_response,
            "created_at": assistant_message.created_at.isoformat()
        }
    }


@router.post("/stream")
async def stream_chat_message(
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):

    # 保存用户消息到数据库
    user_message = ChatMessage(
        id=str(uuid4()),
        user_id=user["id"],
        content=request.content,
        role="user",
        paper_id=request.paper_id
    )
    db.add(user_message)
    
    # 根据配置决定使用测试模式还是真实AI服务
    if settings.TEST_MODE:
        ai_response = TEST_RESPONSE
    else:
        ai_response = process_chat_message(request.content, request.paper_id, user["id"])
    
    # 保存AI回复到数据库
    assistant_message = ChatMessage(
        id=str(uuid4()),
        user_id=user["id"],
        content=ai_response,
        role="assistant",
        paper_id=request.paper_id
    )
    db.add(assistant_message)
    db.commit()
    
    # 内部流式生成器：逐块发送响应
    async def stream_content():
        # 先发送消息ID，便于客户端追踪
        yield f"id: {assistant_message.id}\n\n"
        # 逐词发送AI回复内容
        async for chunk in generate_streaming_response(ai_response):
            yield chunk
    
    # StreamingResponse 是 FastAPI 提供的流式响应类
    # 核心作用：将异步生成器的输出逐块发送给客户端，实现实时数据传输
    # 
    # 关键参数说明：
    # 1. content: 必须是可迭代对象（生成器、异步生成器或列表）
    #    - 本示例中是 async 生成器 stream_content()
    #    - 每次 yield 产生的数据立即发送到客户端，不等待完整响应
    # 2. media_type: 指定响应的 MIME 类型
    #    - "text/event-stream": SSE 协议标准类型，告诉客户端这是事件流
    # 
    # 工作机制：
    # 1. 接收可迭代的 content 对象
    # 2. 自动设置响应头 Transfer-Encoding: chunked
    # 3. 遍历 content，每次 yield 产生一个数据块就立即通过 HTTP 连接发送
    # 4. 迭代结束后自动关闭连接
    # 
    # 与普通 Response 的区别：
    # - Response: 一次性加载所有数据到内存，然后整体发送
    # - StreamingResponse: 按需生成数据，逐块发送，内存占用低
    # 
    # 适用场景：
    # - 大文件下载
    # - 实时数据推送（如聊天消息、日志流）
    # - AI 流式响应（打字机效果）
    # - Server-Sent Events (SSE)
    return StreamingResponse(stream_content(), media_type="text/event-stream")


@router.delete("/history")
async def clear_chat_history(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    db.query(ChatMessage).filter(ChatMessage.user_id == user["id"]).delete()
    db.commit()
    
    return {"success": True, "message": "聊天历史已清空"}