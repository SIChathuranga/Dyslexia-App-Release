import enum
from datetime import datetime
from sqlalchemy import Column, BigInteger, String, Double, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base


class UserRole(str, enum.Enum):
    THERAPIST = "THERAPIST"
    ADMIN = "ADMIN"
    CHILD = "CHILD"


class User(Base):
    __tablename__ = "user"

    id = Column(BigInteger, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    user_name = Column(String)
    user_role = Column(Enum(UserRole))
    is_deleted = Column(String, default="N")

    assessment_histories = relationship("AssessmentHistory", back_populates="user")


class AssessmentHistory(Base):
    __tablename__ = "assessment_history"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("user.id"), nullable=False)
    accuracy = Column(Double, nullable=False)
    completion_rate = Column(Double, nullable=False)
    response_time = Column(Double, nullable=False)
    satisfaction_score = Column(Double, nullable=False)
    assessment_date = Column(DateTime, nullable=False)
    assessment_type = Column(String)
    notes = Column(String(1000))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(String, default="N")

    user = relationship("User", back_populates="assessment_histories")


class Otp(Base):
    __tablename__ = "otp"

    id = Column(BigInteger, primary_key=True, index=True)
    email = Column(String, nullable=False)
    otp = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
