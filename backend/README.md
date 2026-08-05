# Backend - Compex (FastAPI + PostgreSQL)

Este e o servico de backend da aplicacao Compex, construido com FastAPI, PostgreSQL (via Docker) e gerenciado pelo uv.

---

## Pre-requisitos

Certifique-se de ter as seguintes ferramentas instaladas em sua maquina:

* Docker e Docker Compose
* uv (Gerenciador de pacotes e ambientes Python)

Instalacao do uv (caso nao tenha):
* Linux/macOS: `curl -LsSf https://astral.sh/uv/install.sh | sh`
* Windows: `powershell -c "irm https://astral.sh/uv/install.sh | iex"`

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

## 1. Subindo o Banco de Dados (PostgreSQL)

Para iniciar o container do PostgreSQL:

```bash
docker compose up -d
```

* Verificar o status dos containers:
  ```bash
  docker compose ps
  ```
* Ver logs do banco de dados:
  ```bash
  docker compose logs -f postgres
  ```
* Parar o banco de dados:
  ```bash
  docker compose down
  ```

---

## 2. Rodando o Backend (FastAPI)

1. Instalar as dependencias e criar o ambiente virtual:
   ```bash
   uv sync
   ```
   (O uv ira criar a pasta `.venv` e instalar o Python e as bibliotecas automaticamente).

2. Inicie o servidor de desenvolvimento:
   ```bash
   uv run uvicorn main:app --reload
   ```

O servidor estara rodando em: http://localhost:8000

---

## Documentacao da API

Com o servidor rodando, voce pode acessar a documentacao interativa:

* Swagger UI: http://localhost:8000/docs
* ReDoc: http://localhost:8000/redoc
* pgAdmin (Gerenciador Visual do Banco): http://localhost:5050

---

## Comandos Uteis do uv

* Adicionar uma nova biblioteca:
  ```bash
  uv add nome-da-biblioteca
  ```
* Remover uma biblioteca:
  ```bash
  uv remove nome-da-biblioteca
  ```
* Executar comandos no ambiente virtual:
  ```bash
  uv run <comando>
  ```
