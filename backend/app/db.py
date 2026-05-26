from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from datetime import datetime, timedelta

from app.config import settings

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, index=True)
    username = Column(String(100), nullable=False, index=True)
    phone = Column(String(20), unique=True, index=True)
    password_hash = Column(String(255))
    status = Column(Integer, default=0)  # 0-游客，1-正式
    device_fingerprint = Column(String(64), index=True)
    last_ip = Column(String(45), index=True)
    expired_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    exam_papers = relationship("ExamPaper", back_populates="user")
    login_traces = relationship("LoginTrace", back_populates="user")

    def is_guest(self):
        return self.status == 0

    def is_official(self):
        return self.status == 1

    def is_expired(self):
        if self.is_guest() and self.expired_at:
            return datetime.now() > self.expired_at
        return False

    def extend_expiry(self, days=7):
        self.expired_at = datetime.now() + timedelta(days=days)
        return self.expired_at


class LoginTrace(Base):
    __tablename__ = "login_traces"
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    ip_address = Column(String(45), nullable=False, index=True)
    device_fingerprint = Column(String(64), index=True)
    user_agent = Column(String(500))
    login_type = Column(Integer, default=0)  # 0-游客，1-手机号
    success = Column(Boolean, default=True)
    login_time = Column(DateTime, default=datetime.now, index=True)
    
    user = relationship("User", back_populates="login_traces")


class ExamPaper(Base):
    __tablename__ = "exam_paper"
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    original_image_url = Column(String(500), nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    user = relationship("User", back_populates="exam_papers")
    questions = relationship("Question", back_populates="exam_paper")


class Question(Base):
    __tablename__ = "question"
    id = Column(String(36), primary_key=True, index=True)
    paper_id = Column(String(36), ForeignKey("exam_paper.id"), nullable=False)
    content = Column(Text, nullable=False)
    ai_answer = Column(Text)
    user_answer = Column(Text)
    x = Column(Integer, nullable=False)
    y = Column(Integer, nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    answer_x = Column(Integer)
    answer_y = Column(Integer)
    answer_width = Column(Integer)
    answer_height = Column(Integer)
    font_color = Column(String(20), default="#333333")
    font_size = Column(Integer, default=16)
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    
    exam_paper = relationship("ExamPaper", back_populates="questions")


class ChatMessage(Base):
    __tablename__ = "chat_message"
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant
    paper_id = Column(String(36), ForeignKey("exam_paper.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.now, index=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)