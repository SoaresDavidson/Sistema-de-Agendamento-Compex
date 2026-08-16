# Compex

Sistema web para gerenciar clientes, médicos, horários e agendamentos.

## Tecnologias

- **Backend:** Python 3.13, FastAPI, SQLAlchemy, Alembic e PostgreSQL
- **Frontend:** React 19, TypeScript, Vite e Tailwind CSS
- **Infraestrutura:** Docker Compose

## Estrutura

```text
backend/    API, banco de dados, migrations e testes
frontend/   interface web e testes
prototype/  protótipo e documentação funcional
```

## Executar

### Backend

Requer Docker e Docker Compose.

```bash
cd backend
cp .env.example .env
docker compose up -d --build
docker compose exec backend uv run alembic upgrade head
```

API: <http://localhost:8000>  
Swagger UI: <http://localhost:8000/docs>

### Frontend

Requer Node.js e npm.

```bash
cd frontend
npm install
npm run dev
```

Interface: <http://localhost:5173>

## Qualidade

```bash
# Backend
cd backend
uv run pytest
uv run ruff check .

# Frontend
cd frontend
npm run check
npm run test:run
```
