# Backend - Compex (FastAPI + PostgreSQL)

Este e o servico de backend da aplicacao Compex, construido com FastAPI, PostgreSQL (via Docker) e gerenciado pelo uv.

---

## Pre-requisitos

Certifique-se de ter as seguintes ferramentas instaladas em sua maquina:

* Docker
* Docker compose

---

## Configuracao do Ambiente

1. Navegue ate a pasta do backend:
   ```bash
   cd backend
   ```

2. Crie o arquivo de variaveis de ambiente `.env` copiando o modelo `.env.example`:
   ```bash
   cp .env.example .env
   ```
   (Ajuste as credenciais de acesso ao banco no arquivo `.env` se necessario).

---

## Como Rodar a Aplicação 

Para construir as imagens e iniciar todos os serviços (Banco de Dados PostgreSQL + API FastAPI):

```bash
docker compose up -d --build
```
A aplicação estará disponível em **http://localhost:8000**.

### Comandos Uteis do Docker Compose 

* Verificar o status dos containers:
  ```bash
  docker compose ps
  ```
* Ver logs de toda a aplicação:
  ```bash
  docker compose logs -f 
  ```
* Ver logs apenas da API 
  ```bash
  docker compose logs -f backend
  ```
* Ver logs apenas do banco de dados 
  ```bash
  docker compose logs -f postgres 
  ```
* Parar os containers :
  ```bash
  docker compose down
  ```

## Migracoes do banco de dados

O Alembic utiliza a mesma `DATABASE_URL`, o mesmo `engine` e os mesmos modelos
SQLAlchemy da aplicacao.

Com os containers em execucao, aplique todas as migrations pendentes:

```bash
docker compose exec backend uv run alembic upgrade head
```

Para criar uma migration a partir das alteracoes nos modelos:

```bash
docker compose exec backend uv run alembic revision --autogenerate -m "descricao da alteracao"
```

Outros comandos uteis:

```bash
docker compose exec backend uv run alembic current
docker compose exec backend uv run alembic history
docker compose exec backend uv run alembic downgrade -1
```

As migrations geradas ficam em `alembic/versions` e devem ser revisadas antes
de serem adicionadas ao Git.


## Documentacao da API

Com o servidor rodando, voce pode acessar a documentacao interativa:

* Swagger UI: http://localhost:8000/docs
* ReDoc: http://localhost:8000/redoc
* pgAdmin (Gerenciador Visual do Banco): http://localhost:5050

