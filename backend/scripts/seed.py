# scripts/create_user.py
import asyncio
import argparse
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from passlib.context import CryptContext
from sqlalchemy import select

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_user(
    email: str,
    password: str,
    full_name: str,
    role: UserRole,
    department: str,
    region: str | None,
):
    async with AsyncSessionLocal() as session:
        # Check for existing user
        result = await session.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            print(f"✗ User {email} already exists")
            return

        user = User(
            email=email,
            hashed_password=pwd_context.hash(password),
            full_name=full_name,
            role=role,
            department=department,
            region=region,
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        print(f"✓ Created {user.role} — {user.full_name} <{user.email}> (id={user.id})")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a user in the database")
    parser.add_argument("--email",      required=True)
    parser.add_argument("--password",   required=True)
    parser.add_argument("--name",       required=True)
    parser.add_argument("--role",       required=True, choices=[r.value for r in UserRole])
    parser.add_argument("--department", default="IT Operations")
    parser.add_argument("--region",     default=None)
    args = parser.parse_args()

    asyncio.run(create_user(
        email=args.email,
        password=args.password,
        full_name=args.name,
        role=UserRole(args.role),
        department=args.department,
        region=args.region,
    ))
