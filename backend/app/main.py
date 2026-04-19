from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 — register ORM models with Base.metadata
from app.api.v1.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import AsyncSessionLocal, engine
from app.services.escalation import run_escalation_check
from app.services.seed import seed_if_empty

scheduler = AsyncIOScheduler()


async def _escalation_tick() -> None:
    async with AsyncSessionLocal() as session:
        try:
            await run_escalation_check(session)
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await seed_if_empty(session)
        await session.commit()

    scheduler.add_job(
        _escalation_tick,
        "interval",
        seconds=settings.ESCALATION_JOB_INTERVAL_SECONDS,
        id="ticketiq_escalation",
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
