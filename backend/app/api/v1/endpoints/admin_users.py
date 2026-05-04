"""Admin-and-tech-only user directory (read-only MVP)."""

from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import TechOrAdmin, DBSession
from app.models.user import User
from app.schemas.auth import UserPublic

router = APIRouter()

@router.get("", response_model=list[UserPublic])
async def list_users(session: DBSession, _user: TechOrAdmin) -> list[UserPublic]:
    res = await session.execute(select(User).order_by(User.email.asc()))
    rows = res.scalars().all()
    return [UserPublic.model_validate(u) for u in rows]
