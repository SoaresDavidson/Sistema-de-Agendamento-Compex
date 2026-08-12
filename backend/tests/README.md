# Testes do backend

## Cobertura atual da issue #33

Os testes de horários disponíveis nesta etapa são unitários e verificam:

- a estrutura do modelo e seus defaults;
- o relacionamento ORM bidirecional entre horário e médico;
- os contratos de entrada e saída;
- a criação e as consultas realizadas pelo repository;
- a ausência de `commit` dentro do repository.

Há também um teste de integração que comprova a criação e a consulta de um
horário no PostgreSQL utilizando o modelo definitivo de médico. O teste também
valida a navegação de horário para médico e de médico para seus horários. Todas
as alterações são executadas dentro de uma transação e desfeitas ao terminar.

O teste é ignorado automaticamente quando `DATABASE_URL` não está configurada,
permitindo executar os testes unitários sem infraestrutura externa.

## Testes da API

Os testes das rotas utilizam o `TestClient` do FastAPI para verificar os
contratos HTTP de sucesso, validação e conflitos. A biblioteca `httpx2`, exigida
por esse cliente de teste, está no grupo de dependências de desenvolvimento e
não é uma dependência de execução da API.
