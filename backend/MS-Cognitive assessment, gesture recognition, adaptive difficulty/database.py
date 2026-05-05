from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "mysql+pymysql://avnadmin:AVNS_VVz3dwAIhX-p648VqBP@mysql-3c9afe4a-nuwinvinwath47-fbc7.d.aivencloud.com:22364/defaultdb"

engine = create_engine(DATABASE_URL, connect_args={"ssl": {}})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
