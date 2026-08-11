# Testes do backend

## Cobertura atual da issue #33

Os testes de horários disponíveis nesta etapa são unitários e verificam:

- a estrutura do modelo e seus defaults;
- os contratos de entrada e saída;
- a criação e as consultas realizadas pelo repository;
- a ausência de `commit` dentro do repository.

Há também um teste de integração que comprova a criação e a consulta de um
horário no PostgreSQL. Como o modelo definitivo de médico ainda não existe, esse
teste cria uma tabela mínima de `medicos` dentro de uma transação e desfaz toda a
estrutura ao terminar.

## Limitações temporárias

O teste de integração não substitui a validação da estrutura definitiva. Ainda
dependem da implementação do modelo de médico:

- a criação da migration de `horarios` após a integração do médico;
- a execução dessa migration com a chave estrangeira real;
- a validação do relacionamento ORM entre médico e horário.

O teste é ignorado automaticamente quando `DATABASE_URL` não está configurada,
permitindo executar os testes unitários sem infraestrutura externa.

## Testes da API

Os testes das rotas utilizam o `TestClient` do FastAPI para verificar os
contratos HTTP de sucesso, validação e conflitos. A biblioteca `httpx2`, exigida
por esse cliente de teste, está no grupo de dependências de desenvolvimento e
não é uma dependência de execução da API.
