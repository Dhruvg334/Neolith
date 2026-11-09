"""Alembic migration environment for Neolith API."""

import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import Connection, engine_from_config, pool

import neolith_api.core.models
import neolith_api.financial.models
import neolith_api.interactions.models  # noqa: F401
from neolith_api.core.database import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

env_db_url = os.getenv("DATABASE_URL")
if env_db_url:
    if env_db_url.startswith("postgres://"):
        env_db_url = "postgresql+psycopg://" + env_db_url[len("postgres://") :]
    elif env_db_url.startswith("postgresql://") and not env_db_url.startswith("postgresql+"):
        env_db_url = "postgresql+psycopg://" + env_db_url[len("postgresql://") :]
    config.set_main_option("sqlalchemy.url", env_db_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = config.attributes.get("connection", None)
    if connectable is None:
        connectable = engine_from_config(
            config.get_section(config.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )

    if isinstance(connectable, Connection):
        context.configure(connection=connectable, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
    elif connectable is not None:
        with connectable.connect() as connection:
            context.configure(connection=connection, target_metadata=target_metadata)
            with context.begin_transaction():
                context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
