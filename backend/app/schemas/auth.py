from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    region: str | None
    department: str

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
