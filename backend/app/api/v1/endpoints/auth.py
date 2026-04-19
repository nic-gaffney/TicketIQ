from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DBSession
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserPublic

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, session: DBSession) -> TokenResponse:
    res = await session.execute(select(User).where(User.email == str(body.email)))
    user = res.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserPublic.model_validate(user))


@router.get("/me", response_model=UserPublic)
async def me(user: CurrentUser) -> User:
    return user
