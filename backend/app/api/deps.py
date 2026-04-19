from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User, UserRole

security = HTTPBearer()


async def get_current_user(
    cred: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    user_id = decode_token(cred.credentials)
    if user_id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    res = await session.execute(select(User).where(User.id == int(user_id)))
    user = res.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


def require_roles(*roles: UserRole):
    async def _inner(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return user

    return _inner


CurrentUser = Annotated[User, Depends(get_current_user)]
DBSession = Annotated[AsyncSession, Depends(get_db)]
AdminUser = Annotated[User, Depends(require_roles(UserRole.admin))]
TechOrAdmin = Annotated[User, Depends(require_roles(UserRole.it_support, UserRole.admin))]
