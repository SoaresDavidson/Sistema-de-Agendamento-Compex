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

## Funcionalidades implementadas

- Cadastro e listagem de clientes (com validação de duplicidade por nome e data de nascimento)
- Cadastro de médicos e especialidades
- Cadastro de horários disponíveis individuais e em lote (com divisão em blocos de atendimento)
- Agendamento de consultas com validação e impedimento de conflito de horários
- Cancelamento de agendamento por solicitação do cliente (libera o horário) ou por indisponibilidade médica (desativa o horário)
- Listagem paginada dos próximos agendamentos com filtros por médico, especialidade, cliente, status e data

## Principais dificuldades encontradas
- Dependência entre tarefas: algumas issues dependiam da conclusão de outras, o que exigiu coordenação da equipe e, em alguns momentos, bloqueou temporariamente o avanço de determinadas funcionalidades.

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
