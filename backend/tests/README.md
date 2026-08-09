# Testes do backend

## Cobertura atual da issue #33

Os testes de horários disponíveis nesta etapa são unitários e verificam:

- a estrutura do modelo e seus defaults;
- os contratos de entrada e saída;
- a criação e as consultas realizadas pelo repository;
- a ausência de `commit` dentro do repository.

## Limitações temporárias

Os testes ainda não cobrem a persistência integrada no PostgreSQL. Essa cobertura
depende de duas entregas externas à issue #33:

- a configuração do Alembic e da camada de abstração do banco, prevista na issue
  #9;
- a implementação da tabela e do modelo de médico, necessários para validar a
  chave estrangeira `horarios.medico_id`.

Após essas integrações, ainda será necessário criar e testar a migration de
`horarios` e comprovar a criação e a consulta de registros no PostgreSQL.
