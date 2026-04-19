from fastapi import APIRouter

from app.api.deps import AdminUser, DBSession
from app.schemas.ticket import EscalationConfigOut, EscalationConfigUpdate
from app.services.escalation import get_escalation_config, run_escalation_check

router = APIRouter()


@router.get("", response_model=EscalationConfigOut)
async def get_config(session: DBSession, _admin: AdminUser) -> EscalationConfigOut:
    cfg = await get_escalation_config(session)
    return EscalationConfigOut.model_validate(cfg)


@router.post("/run-check")
async def run_escalation_manual(session: DBSession, _admin: AdminUser) -> dict:
    n = await run_escalation_check(session)
    return {"tickets_escalated": n}


@router.patch("", response_model=EscalationConfigOut)
async def patch_config(
    body: EscalationConfigUpdate,
    session: DBSession,
    _admin: AdminUser,
) -> EscalationConfigOut:
    cfg = await get_escalation_config(session)
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(cfg, k, v)
    session.add(cfg)
    await session.flush()
    return EscalationConfigOut.model_validate(cfg)
