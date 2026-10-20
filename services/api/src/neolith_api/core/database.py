"""SQLAlchemy 2.0 database engine, session factory, and declarative base."""

from collections.abc import Generator
from typing import Any

from fastapi import Request
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from neolith_api.core.config import Settings, get_settings


class Base(DeclarativeBase):
    """Declarative base for all Neolith SQLAlchemy 2.0 ORM models."""


def build_engine(database_url: str | None = None) -> Engine:
    """Create a SQLAlchemy 2.0 Engine for PostgreSQL or SQLite."""
    resolved_url = database_url or get_settings().database_url
    kwargs: dict[str, Any] = {"pool_pre_ping": True}
    if resolved_url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
        if ":memory:" in resolved_url:
            kwargs["poolclass"] = StaticPool
    return create_engine(resolved_url, **kwargs)


def build_session_factory(engine: Engine) -> sessionmaker[Session]:
    """Create a configured SQLAlchemy Session factory."""
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def initialize_database(
    engine: Engine,
    *,
    seed_if_empty: bool = True,
) -> sessionmaker[Session]:
    """Ensure all ORM tables exist and optionally seed deterministic financial demo data."""
    import neolith_api.core.models
    import neolith_api.financial.models  # noqa: F401
    from neolith_api.seed import seed_demo_data

    Base.metadata.create_all(bind=engine)
    factory = build_session_factory(engine)
    if seed_if_empty:
        with factory() as session:
            seed_demo_data(session, reset=False)
    return factory


def get_session_factory(request: Request) -> sessionmaker[Session]:
    """Retrieve or lazily initialize the application's sessionmaker on app.state."""
    factory = getattr(request.app.state, "session_factory", None)
    if factory is not None:
        return factory  # type: ignore[no-any-return]

    settings: Settings = getattr(request.app.state, "settings", None) or get_settings()
    engine = build_engine(settings.database_url)
    new_factory = initialize_database(engine, seed_if_empty=True)
    request.app.state.db_engine = engine
    request.app.state.session_factory = new_factory
    return new_factory


def get_db_session(request: Request) -> Generator[Session, None, None]:
    """FastAPI dependency yielding a transactional database session."""
    factory = get_session_factory(request)
    session = factory()
    try:
        yield session
    finally:
        session.close()
