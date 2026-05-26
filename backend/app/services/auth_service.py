from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from datetime import datetime, timedelta
from uuid import uuid4
from typing import Optional, Tuple, Dict
import hashlib

from app.db import User, LoginTrace, SessionLocal


class DeviceIdManager:
    def __init__(self, secret_key: str, salt: str = "device_id"):
        self.signer = URLSafeTimedSerializer(secret_key, salt=salt)
        self.expire_days = 365

    def generate_device_id(self) -> str:
        return str(uuid4())

    def sign_device_id(self, device_id: str) -> str:
        return self.signer.dumps({
            "device_id": device_id,
            "issued_at": datetime.utcnow().isoformat()
        })

    def verify_device_id(self, signed_device_id: str) -> Tuple[bool, Optional[dict]]:
        try:
            data = self.signer.loads(
                signed_device_id,
                max_age=self.expire_days * 24 * 3600
            )
            return True, data
        except SignatureExpired:
            return False, {"error": "signature_expired"}
        except BadSignature:
            return False, {"error": "invalid_signature"}
        except Exception as e:
            return False, {"error": str(e)}

    def refresh_device_id(self, signed_device_id: str) -> Optional[str]:
        valid, data = self.verify_device_id(signed_device_id)
        if valid and data:
            return self.sign_device_id(data["device_id"])
        return None


class AuthService:
    def __init__(self, secret_key: str):
        self.device_manager = DeviceIdManager(secret_key)
        self.GUEST_EXPIRE_DAYS = 7
        self.DUPLICATE_CHECK_HOURS = 24

    def generate_guest_username(self) -> str:
        """生成游客用户名：游客 + 4位随机码"""
        random_suffix = hashlib.md5(str(uuid4()).encode()).hexdigest()[:4].upper()
        return f"游客{random_suffix}"

    def find_existing_guest(self, db: SessionLocal, ip_address: str, 
                            device_fingerprint: str) -> Optional[User]:
        """查找24小时内同IP+设备的游客用户"""
        cutoff_time = datetime.now() - timedelta(hours=self.DUPLICATE_CHECK_HOURS)
        
        # 先按设备指纹精确匹配
        user = db.query(User).filter(
            User.device_fingerprint == device_fingerprint,
            User.status == 0,
            User.created_at >= cutoff_time
        ).first()
        
        if user:
            return user
        
        # 再按IP+设备指纹组合匹配
        user = db.query(User).filter(
            User.last_ip == ip_address,
            User.device_fingerprint == device_fingerprint,
            User.status == 0,
            User.created_at >= cutoff_time
        ).first()
        
        return user

    def create_guest_user(self, db: SessionLocal, ip_address: str, 
                          device_fingerprint: str) -> User:
        """创建新的游客用户"""
        user_id = str(uuid4())
        username = self.generate_guest_username()
        
        user = User(
            id=user_id,
            username=username,
            status=0,
            device_fingerprint=device_fingerprint,
            last_ip=ip_address,
            expired_at=datetime.now() + timedelta(days=self.GUEST_EXPIRE_DAYS)
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user

    def record_login_trace(self, db: SessionLocal, user_id: str, ip_address: str,
                          device_fingerprint: str, user_agent: str, login_type: int = 0):
        """记录登录追踪"""
        trace = LoginTrace(
            id=str(uuid4()),
            user_id=user_id,
            ip_address=ip_address,
            device_fingerprint=device_fingerprint,
            user_agent=user_agent,
            login_type=login_type,
            success=True
        )
        db.add(trace)
        db.commit()

    def guest_login(self, db: SessionLocal, ip_address: str, 
                    device_fingerprint: str, user_agent: str) -> Dict:
        """游客自动登录"""
        # 1. 检查是否有重复用户
        existing_user = self.find_existing_guest(db, ip_address, device_fingerprint)
        
        if existing_user:
            # 延长有效期
            existing_user.extend_expiry(self.GUEST_EXPIRE_DAYS)
            existing_user.last_ip = ip_address
            db.commit()
            
            user = existing_user
        else:
            # 2. 创建新游客用户
            user = self.create_guest_user(db, ip_address, device_fingerprint)
        
        # 3. 生成设备ID和签名
        device_id = self.device_manager.generate_device_id()
        signed_device_id = self.device_manager.sign_device_id(device_id)
        
        # 4. 记录登录追踪
        self.record_login_trace(db, user.id, ip_address, device_fingerprint, user_agent, 0)
        
        return {
            "user_id": user.id,
            "username": user.username,
            "status": user.status,
            "signed_device_id": signed_device_id,
            "expired_at": user.expired_at.isoformat() if user.expired_at else None
        }

    def upgrade_to_official(self, db: SessionLocal, user_id: str, 
                           phone: str, new_username: Optional[str] = None) -> Optional[User]:
        """升级为正式用户"""
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            return None
        
        # 检查手机号是否已被绑定
        existing = db.query(User).filter(User.phone == phone, User.id != user_id).first()
        if existing:
            return None
        
        # 更新用户信息
        user.phone = phone
        user.status = 1
        user.expired_at = None  # 正式用户永不过期
        if new_username:
            user.username = new_username
        
        db.commit()
        db.refresh(user)
        
        return user

    def update_username(self, db: SessionLocal, user_id: str, new_username: str) -> bool:
        """修改用户名"""
        # 检查用户名是否已存在
        existing = db.query(User).filter(
            User.username == new_username,
            User.id != user_id
        ).first()
        
        if existing:
            return False
        
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.username = new_username
            db.commit()
            return True
        
        return False

    def verify_token(self, db: SessionLocal, signed_device_id: str) -> Optional[Dict]:
        """验证Token并获取用户信息"""
        valid, data = self.device_manager.verify_device_id(signed_device_id)
        
        if not valid or not data:
            return None
        
        # 这里可以根据业务需求扩展验证逻辑
        return {
            "device_id": data.get("device_id"),
            "issued_at": data.get("issued_at"),
            "valid": True
        }
