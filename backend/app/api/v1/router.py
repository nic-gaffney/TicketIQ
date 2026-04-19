from fastapi import APIRouter

from app.api.v1.endpoints import audit, auth, escalation_config, health, reports, tickets

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(escalation_config.router, prefix="/admin/escalation", tags=["admin-escalation"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
