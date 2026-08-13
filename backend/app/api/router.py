from fastapi import APIRouter

from app.api.routers.clientes import router as clientes_router
from app.api.routers.horarios import router as horarios_router

api_router = APIRouter(prefix="/api")

api_router.include_router(clientes_router)
api_router.include_router(horarios_router)
