from fastapi import APIRouter

from app.api.routers.agendamentos import router as agendamentos_router
from app.api.routers.clientes import router as clientes_router
from app.api.routers.horarios import router as horarios_router
from app.api.routers.medicos import router as medicos_router

api_router = APIRouter(prefix="/api")

api_router.include_router(agendamentos_router)
api_router.include_router(clientes_router)
api_router.include_router(horarios_router)
api_router.include_router(medicos_router)
