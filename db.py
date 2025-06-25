from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///./rules.db"

# echo=True helps with debugging SQL queries; turn it off in prod
engine = create_engine(DATABASE_URL, echo=True)


def init_db():
    """Create tables if they don't exist."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Yield a session for dependency injection in FastAPI."""
    with Session(engine) as session:
        yield session
