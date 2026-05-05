import random
import smtplib
import logging
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from models import Otp, User
from utils import Constant

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Update these with your SMTP config
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "your@email.com"
SMTP_PASSWORD = "your_password"


class OtpService:

    def generate_otp(self) -> str:
        return str(random.randint(100000, 999999))

    def send_otp(self, to: str, otp: str, db: Session) -> bool:
        try:
            # Delete existing OTP for this email
            db.query(Otp).filter(Otp.email == to).delete()

            otp_entity = Otp(
                email=to,
                otp=otp,
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(minutes=5)
            )
            db.add(otp_entity)
            db.commit()

            msg = MIMEText(f"Your OTP for password reset is: {otp}")
            msg["Subject"] = "Password Reset OTP"
            msg["From"] = SMTP_USER
            msg["To"] = to

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)

            return True
        except Exception as e:
            logger.error("Error sending OTP: %s", str(e))
            db.rollback()
            return False

    def validate_otp(self, email: str, otp: str, db: Session) -> bool:
        record = db.query(Otp).filter(
            Otp.email == email,
            Otp.otp == otp
        ).first()
        return record is not None and record.expires_at > datetime.utcnow()

    def reset_password(self, email: str, new_password: str, db: Session):
        user = db.query(User).filter(
            User.email == email,
            User.is_deleted == Constant.DB_FALSE
        ).first()
        if user:
            user.password = pwd_context.hash(new_password)
            db.commit()


otp_service = OtpService()
