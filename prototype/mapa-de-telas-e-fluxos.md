# Mapa de telas e fluxos

## Relação entre telas e casos de uso

| Tela | Arquivo | Casos de uso / requisitos |
|---|---|---|
| Launcher | `index.html` | Navegação do protótipo |
| Visão geral | `overview.html` | UC10, RF12 e ações para UC01, UC05, UC07 |
| Agendamentos | `agendamentos.html` | UC08, UC10, RF11–RF13 |
| Novo agendamento | `novo-agendamento.html` | UC07, RF09–RF10, RN05–RN06 |
| Detalhes | `agendamento-detalhes.html` | UC08, estados e histórico |
| Horários | `horarios.html` | UC06, UC09, RF06–RF07 |
| Cadastro de horários | `horario-form.html` | UC05, RF05, RF08, RN03–RN04, RN10 |
| Clientes | `clientes.html` | UC02, RF02 |
| Cadastro/edição de cliente | `cliente-form.html` | UC01, RF01, RN01 |
| Médicos | `medicos.html` | UC03, RF03, RN02 |
| Especialidades | `especialidades.html` | UC04, RF04 |

## Mapa de navegação

```mermaid
flowchart LR
    I[index.html] --> V[Visão geral]
    V --> A[Agendamentos]
    V --> H[Horários]
    V --> C[Clientes]
    A --> N[Novo agendamento]
    A --> D[Detalhes]
    D --> X[Cancelar]
    H --> HF[Cadastro individual ou em lote]
    H --> N[Marcar horário com agenda pré-preenchida]
    C --> CF[Cadastro ou edição]
    V --> M[Médicos]
    M --> E[Especialidades]
```

## Cadastrar cliente — UC01

```mermaid
flowchart TD
    A[Clientes] --> B[Cadastrar cliente]
    B --> C[Preencher nome, telefone, e-mail opcional e nascimento]
    C --> D{Dados válidos?}
    D -- Não --> E[Mostrar erros associados]
    E --> C
    D -- Sim --> F{Mesmo nome e nascimento?}
    F -- Sim --> G[Alertar possível duplicidade]
    G --> H{Confirmar mesmo assim?}
    H -- Não --> C
    H -- Sim --> I[Simular cadastro]
    F -- Não --> I
    I --> J[Mensagem de sucesso]
```

## Cadastrar horários — UC05

```mermaid
flowchart TD
    A[Horários] --> B[Cadastrar horários]
    B --> C{Modalidade}
    C -- Individual --> D[Médico, data, início e fim]
    C -- Em lote --> E[Médico, datas, dias, períodos e duração]
    D --> F[Validar passado, ordem e sobreposição]
    E --> G[Gerar blocos individuais]
    G --> H[Prévia com totais e conflitos]
    F --> I{Válido?}
    H --> I
    I -- Não --> J[Ajustar dados]
    J --> C
    I -- Sim --> K[Simular criação dos horários ativos]
```

## Realizar agendamento — UC07

```mermaid
flowchart TD
    A[Novo agendamento] --> B[Selecionar cliente]
    AT[Horários: ação Marcar horário] --> PF[Especialidade, médico, data e intervalo pré-preenchidos]
    PF --> B
    B --> C[Filtrar especialidade]
    C --> D[Selecionar médico]
    D --> E[Selecionar data]
    E --> F[Exibir horários derivados como disponíveis]
    F --> G[Selecionar bloco]
    G --> R[Revisar cliente, médico, especialidades, data, início e fim]
    R --> I[Confirmar]
    I --> J{Ainda ativo, futuro e sem AGENDADO?}
    J -- Não --> K[Informar conflito e atualizar blocos]
    K --> F
    J -- Sim --> L[Criar AGENDADO]
    L --> M[Confirmar sucesso]
```

## Cancelamento solicitado pelo cliente — UC08 / RN07

```mermaid
flowchart TD
    A[Agendamento AGENDADO] --> B[Cancelar]
    B --> C[Origem: CLIENTE]
    C --> D[Observação opcional]
    D --> E[Confirmar]
    E --> F[Status CANCELADO + origem e data]
    F --> G[Horário permanece ativo]
    G --> H[Sem AGENDADO, volta a disponível]
```

## Cancelamento causado pelo médico — UC08 / RN08

```mermaid
flowchart TD
    A[Agendamento AGENDADO] --> B[Cancelar]
    B --> C[Origem: MEDICO]
    C --> D[Observação opcional]
    D --> E[Confirmar]
    E --> F[Status CANCELADO + origem e data]
    F --> G[Desativar horário]
    G --> H[Não volta à disponibilidade]
```

## Consultar próximos agendamentos — UC10

```mermaid
flowchart TD
    A[Agendamentos] --> B[Listar em ordem cronológica]
    B --> C[Aplicar cliente, médico, especialidade, status e data]
    C --> D{Há resultados?}
    D -- Não --> E[Estado vazio + limpar filtros]
    D -- Sim --> F[Tabela paginada]
    F --> G[Detalhes ou cancelamento]
```

## Regra transversal de disponibilidade

```mermaid
flowchart TD
    A[Horário] --> B{Ativo?}
    B -- Não --> X[INATIVO]
    B -- Sim --> C{Início no futuro?}
    C -- Não --> Y[PASSADO]
    C -- Sim --> D{Possui AGENDADO?}
    D -- Sim --> Z[OCUPADO]
    D -- Não --> W[DISPONIVEL]
```
