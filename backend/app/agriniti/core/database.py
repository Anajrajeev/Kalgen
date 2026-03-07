"""
SQLite database engine + session factory.
Uses synchronous SQLAlchemy (perfect for SQLite, works natively with FastAPI deps).
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

SQLITE_URL = "sqlite:///./agriniti.db"

engine = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False, "timeout": 30.0},
    pool_size=30,
    max_overflow=20,
    echo=False,
)

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
