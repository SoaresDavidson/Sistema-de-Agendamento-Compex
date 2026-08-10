# Testes do backend

## Cobertura atual da issue #33

Os testes de horários disponíveis nesta etapa são unitários e verificam:

- a estrutura do modelo e seus defaults;
- os contratos de entrada e saída;
- a criação e as consultas realizadas pelo repository;
- a ausência de `commit` dentro do repository.

## Limitações temporárias

Os testes ainda não cobrem a persistência integrada no PostgreSQL. A camada de
banco e o Alembic já estão configurados pela issue #9, mas essa cobertura ainda
depende de:

- a implementação da tabela e do modelo de médico, necessários para validar a
  chave estrangeira `horarios.medico_id`;
- a criação da migration de `horarios` após a integração do médico.

Após essa integração, será necessário testar a migration e comprovar a criação e
a consulta de registros no PostgreSQL.
