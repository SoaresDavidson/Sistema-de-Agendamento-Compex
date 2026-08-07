# Sistema de Agendamento para Clínica

## Apresentação

Este projeto consiste no desenvolvimento de um sistema de agendamento para uma clínica fictícia, criado como parte da segunda fase do processo seletivo da COMPEX.

O sistema tem como objetivo facilitar a organização dos clientes, médicos, horários disponíveis e agendamentos da clínica, substituindo o controle manual e reduzindo a ocorrência de conflitos de horário.

A aplicação será utilizada internamente pela clínica, centralizando o gerenciamento dos atendimentos em uma única interface.

## Escopo do sistema

O sistema permitirá:

- realizar agendamentos para clientes;
- impedir que um mesmo horário seja ocupado por mais de um cliente para o mesmo médico;
- listar e consultar os próximos agendamentos;
- cancelar agendamentos;
- cadastrar e consultar clientes;
- cadastrar e consultar médicos;
- cadastrar e consultar os horários disponíveis de cada médico;
- consultar os horários disponíveis por data, médico ou especialidade;
- filtrar a listagem de agendamentos;
- cadastrar especialidades associadas aos médicos.

Médicos diferentes poderão possuir atendimentos no mesmo período, pois a disponibilidade e os conflitos serão controlados individualmente para cada médico.

## Organização da documentação

A documentação está organizada nas seguintes páginas:

- [[Requisitos e Casos de Uso|Requisitos e Casos de Uso]] — apresenta as funcionalidades, regras de negócio, atores e principais interações previstas no sistema.
- [[Modelagem de Dados|Modelagem de Dados]] — apresenta as entidades, atributos, relacionamentos, restrições e decisões adotadas para a persistência dos dados.

As tecnologias utilizadas, instruções de instalação e execução, funcionalidades implementadas e demais informações da entrega serão apresentadas no README do repositório.
