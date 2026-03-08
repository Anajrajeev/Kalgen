"""
SQLite database engine + session factory.
Uses synchronous SQLAlchemy (perfect for SQLite, works natively with FastAPI deps).
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import settings

# FORCE DUMMY LOCAL DB TO PREVENT HANGS (We use Supabase REST Client instead)
db_url = "sqlite:///:memory:"

# Engine arguments
engine_kwargs = {
"connect_args": {"check_same_thread": False},
"echo": False
}

is_sqlite = True
if is_sqlite:
    engine_kwargs["connect_args"]["timeout"] = 30.0
else:
    engine_kwargs["pool_size"] = 30
    engine_kwargs["max_overflow"] = 20

engine = create_engine(db_url, **engine_kwargs)

# Enable Write-Ahead Logging (WAL) for high concurrency
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# FastAPI dependency — yields a DB session and closes it after the request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
