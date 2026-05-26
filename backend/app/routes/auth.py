from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime

from app.db import get_db, SessionLocal, User
from app.services.auth_service import AuthService
from app.config import settings
from app.utils.validators import validate_username, validate_phone, validate_sms_code

router = APIRouter(prefix="/api/auth", tags=["auth"])

auth_service = AuthService(secret_key=settings.SECRET_KEY)


class GuestLoginRequest(BaseModel):
    device_fingerprint: str = Field(..., description="设备指纹")
    user_agent: Optional[str] = None


class GuestLoginResponse(BaseModel):
    success: bool
    user_id: Optional[str] = None
    username: Optional[str] = None
    status: Optional[int] = None
    signed_device_id: str
    expired_at: Optional[str]
    message: Optional[str] = None


class UpgradeRequest(BaseModel):
    phone: Optional[str] = Field(None, description="手机号（选填）")
    code: Optional[str] = Field(None, description="验证码（选填，填写手机号时必填）")
    new_username: Optional[str] = None


class UpgradeResponse(BaseModel):
    success: bool
    user_id: Optional[str] = None
    username: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[int] = None
    message: Optional[str] = None


class RefreshRequest(BaseModel):
    signed_device_id: str = Field(..., description="当前签名的设备ID")


class RefreshResponse(BaseModel):
    success: bool
    signed_device_id: Optional[str] = None
    message: Optional[str] = None


class UpdateUsernameRequest(BaseModel):
    new_username: str = Field(..., description="新用户名")
    phone: Optional[str] = None
    code: Optional[str] = None


class UpdateUsernameResponse(BaseModel):
    success: bool
    username: Optional[str] = None
    message: Optional[str] = None


def get_client_ip(request: Request) -> str:
    """获取客户端IP地址"""
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.client.host


@router.post("/guest-login", response_model=GuestLoginResponse)
async def guest_login(
    request: GuestLoginRequest,
    http_request: Request,
    db: SessionLocal = Depends(get_db)
):
    """游客自动登录"""
    ip_address = get_client_ip(http_request)
    
    try:
        result = auth_service.guest_login(
            db=db,
            ip_address=ip_address,
            device_fingerprint=request.device_fingerprint,
            user_agent=request.user_agent or ""
        )
        
        return GuestLoginResponse(
            success=True,
            user_id=result["user_id"],
            username=result["username"],
            status=result["status"],
            signed_device_id=result["signed_device_id"],
            expired_at=result["expired_at"]
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"登录失败: {str(e)}")


def verify_sms_code(phone: str, code: str) -> bool:
    """
    验证短信验证码（伪代码）
    
    实际项目中需要：
    1. 从Redis缓存中获取该手机号对应的验证码
    2. 验证验证码是否匹配
    3. 验证验证码是否过期（通常5分钟）
    4. 验证成功后删除或标记验证码已使用
    
    :param phone: 手机号
    :param code: 验证码
    :return: 是否验证通过
    """
    # TODO: 接入短信服务后实现以下逻辑
    # 1. 从缓存获取: cache.get(f"sms:{phone}")
    # 2. 比对验证码: stored_code == code
    # 3. 检查过期: timestamp > now() - 300
    
    # 演示模式：直接返回成功
    # 生产环境请替换为实际的验证码验证逻辑
    # 建议使用 Redis + 短信服务商（如阿里云、腾讯云）
    if code:
        return True
    return False


@router.put("/username", response_model=UpdateUsernameResponse)
async def update_username(
    request: UpdateUsernameRequest,
    db: SessionLocal = Depends(get_db)
):
    """修改用户名（支持升级操作）"""
    # 1. 校验用户名
    username_valid, username_error = validate_username(request.new_username)
    if not username_valid:
        return UpdateUsernameResponse(
            success=False,
            message=username_error
        )
    
    # 2. 检查用户名是否已存在
    existing = db.query(User).filter(User.username == request.new_username).first()
    if existing:
        return UpdateUsernameResponse(
            success=False,
            message="用户名已存在"
        )
    
    # 3. 处理手机号升级逻辑
    if request.phone:
        # 3.1 校验手机号
        phone_valid, phone_error = validate_phone(request.phone)
        if not phone_valid:
            return UpdateUsernameResponse(
                success=False,
                message=phone_error
            )
        
        # 3.2 校验验证码（当有手机号时必须提供验证码）
        if not request.code:
            return UpdateUsernameResponse(
                success=False,
                message="请输入验证码"
            )
        
        # 3.3 校验验证码格式
        code_valid, code_error = validate_sms_code(request.code)
        if not code_valid:
            return UpdateUsernameResponse(
                success=False,
                message=code_error
            )
        
        # 3.4 验证短信验证码（伪代码，接入短信服务后完善）
        if not verify_sms_code(request.phone, request.code):
            return UpdateUsernameResponse(
                success=False,
                message="验证码错误或已过期"
            )
        
        # 3.5 检查手机号是否已被其他用户绑定
        phone_existing = db.query(User).filter(
            User.phone == request.phone
        ).first()
        if phone_existing:
            return UpdateUsernameResponse(
                success=False,
                message="该手机号已被绑定"
            )
        
        # 3.6 执行升级操作
        user = db.query(User).first()  # 实际项目中从Token获取用户
        if user:
            user.username = request.new_username
            user.phone = request.phone
            user.status = 1
            user.expired_at = None
            db.commit()
            db.refresh(user)
            
            return UpdateUsernameResponse(
                success=True,
                username=user.username
            )
        else:
            return UpdateUsernameResponse(
                success=False,
                message="未找到用户"
            )
    
    # 4. 仅修改用户名（不升级）
    return UpdateUsernameResponse(
        success=True,
        username=request.new_username
    )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(
    request: RefreshRequest
):
    """刷新Token"""
    new_token = auth_service.device_manager.refresh_device_id(request.signed_device_id)
    
    if new_token:
        return RefreshResponse(
            success=True,
            signed_device_id=new_token
        )
    else:
        return RefreshResponse(
            success=False,
            message="Token刷新失败，请重新登录"
        )


@router.post("/send-sms")
async def send_sms(
    phone: str,
    scene: str = "upgrade"
):
    """发送验证码（伪代码）"""
    # 1. 校验手机号
    phone_valid, phone_error = validate_phone(phone)
    if not phone_valid:
        return {
            "success": False,
            "message": phone_error
        }
    
    # TODO: 接入短信服务后实现以下逻辑
    # 1. 生成6位随机验证码: random.randint(100000, 999999)
    # 2. 存储到Redis: cache.set(f"sms:{phone}", {"code": xxx, "timestamp": now()}, ex=300)
    # 3. 调用短信服务商API发送验证码
    # 4. 限制发送频率（如60秒内只能发送一次）
    
    # 演示模式：直接返回成功
    # 生产环境请替换为实际的短信发送逻辑
    # 建议使用阿里云/腾讯云短信服务
    return {
        "success": True,
        "message": "验证码已发送（演示模式）",
        "scene": scene,
        "phone": phone[:3] + "****" + phone[-4:]
    }
