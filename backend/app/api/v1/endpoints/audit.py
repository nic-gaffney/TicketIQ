from fastapi import APIRouter, Query
from sqlalchemy import select

from app.api.deps import AdminUser, DBSession
from app.models.audit_log import AuditLog
from app.schemas.ticket import AuditLogOut

router = APIRouter()


@router.get("", response_model=list[AuditLogOut])
async def list_audit_logs(
    session: DBSession,
    _admin: AdminUser,
    ticket_id: int | None = None,
    limit: int = Query(100, le=500),
) -> list[AuditLogOut]:
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    if ticket_id is not None:
        stmt = stmt.where(AuditLog.ticket_id == ticket_id)
    res = await session.execute(stmt)
    return [AuditLogOut.model_validate(r) for r in res.scalars().all()]
