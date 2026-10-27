from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL") or ""
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql://" + DATABASE_URL[len("postgres://"):]

engine_options = {}
if DATABASE_URL.startswith("postgresql"):
    # Neon (serverless Postgres) closes idle connections. Check each pooled
    # connection before use and replace connections older than five minutes,
    # so an always-on server does not fail on its first query after a quiet spell.
    engine_options = {"pool_pre_ping": True, "pool_recycle": 300}

engine = create_engine(DATABASE_URL, **engine_options)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()