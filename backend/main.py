from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers.horarios import router as horarios_router

app = FastAPI(title="Compex API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(horarios_router)


@app.get("/")
def read_root():
    return {"message": "API Compex rodando com sucesso no Docker!"}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
