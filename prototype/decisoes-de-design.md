# Decisões de design

## Arquitetura da informação

A aplicação foi organizada pelos objetos operacionais do domínio: Agendamentos, Horários, Clientes, Médicos e Especialidades. “Visão geral” funciona como fila de trabalho, não como dashboard analítico. A separação entre Horários e Agendamentos reflete a modelagem: um horário é um bloco disponibilizado; um agendamento é a reserva histórica desse bloco.

## Navegação e hierarquia

A sidebar fornece acesso direto às seis áreas principais. Fluxos de criação e detalhe são páginas filhas e aparecem em breadcrumbs, evitando poluir a navegação principal. Cada tela segue título → contexto → ação primária → filtros/formulário → conteúdo.

## Telas e arquivos

- `index.html`: launcher do protótipo.
- `overview.html`: visão geral operacional.
- `agendamentos.html`: consulta, filtros, paginação e cancelamento.
- `novo-agendamento.html`: fluxo guiado de agendamento.
- `agendamento-detalhes.html`: dados completos e histórico.
- `horarios.html`: listagem, situações e agenda por data.
- `horario-form.html`: cadastro individual e em lote.
- `clientes.html` e `cliente-form.html`: consulta, cadastro e edição simulada.
- `medicos.html`: consulta, cadastro e múltiplas especialidades.
- `especialidades.html`: cadastro, edição, duplicidade e exclusão condicionada.

## Decisões de UX

### Formulários

Campos obrigatórios são marcados no label. Mensagens explicam a regra violada e como corrigir. Cadastro de cliente coloca nome e data de nascimento em pontos de leitura clara porque a combinação aciona o alerta de duplicidade. E-mail permanece opcional e sexo não foi incluído.

### Novo agendamento

O fluxo principal segue a ordem solicitada: cliente → especialidade → médico → data → horários → revisão → confirmação. A especialidade filtra médicos, mas não aparece como campo persistido do agendamento. O resumo lateral reduz erros antes da confirmação. O modal de conflito demonstra a nova verificação de disponibilidade e oferece atualização dos horários sem perder o restante do contexto.

A listagem de horários oferece um atalho contextual adicional: em um bloco `DISPONIVEL`, “Marcar horário” abre o novo agendamento com especialidade, médico, data e intervalo já preenchidos. Nesse caminho, somente a seleção do cliente permanece pendente. O dado continua sendo verificado novamente antes da confirmação.

### Filtros

Agendamentos usam busca por cliente e filtros por médico, especialidade, status e intervalo de datas. Horários incluem data, médico, especialidade e situação; a data selecionada restringe efetivamente as linhas exibidas. “Limpar” retorna à listagem completa e o estado vazio explica que os filtros causaram a ausência de resultados.

### Tabelas

Colunas de identificação vêm antes de data/estado; ações ficam à direita. Agendamentos são ordenados por data e hora em ordem cronológica crescente. Datas e horários usam fonte monoespaçada. Em telas estreitas, rolagem horizontal preserva a comparação e evita cartões excessivos. Paginação mostra página atual e quantidade fixa por página. Em clientes, a única ação de linha é “Editar”, pois os dados já estão visíveis na própria tabela.

### Agenda

A grade semanal complementa a tabela, sem substituí-la. Ela facilita leitura temporal, enquanto a tabela sustenta filtros e ações precisas. Blocos trazem estado textual e contexto; disponibilidade não é tratada como campo salvo.

### Conflitos

- Horário ocupado: escolha bloqueada e mensagem imediata.
- Horário tomado antes da confirmação: modal informa que nada foi criado e permite atualizar.
- Sobreposição no cadastro individual: informa o intervalo existente do mesmo médico.
- Cadastro em lote: prévia conta válidos e conflitos e marca os blocos conflitantes antes da criação.
- Médicos diferentes podem manter períodos simultâneos; a mensagem de validação torna isso explícito.

### Cancelamentos

O modal exige origem e oferece observação opcional. Para `CLIENTE`, comunica que o horário permanece ativo e volta à disponibilidade. Para `MEDICO`, comunica que o horário será desativado. O histórico é preservado e um agendamento cancelado deixa de oferecer nova ação de cancelamento.

## Diferenças visuais de estado

| Estado | Tratamento | Significado operacional |
|---|---|---|
| Disponível | verde-petróleo, borda tracejada na agenda, texto | Ativo, futuro e sem AGENDADO |
| Ocupado | âmbar, texto e cliente quando houver | Existe AGENDADO no horário |
| Cancelado | vermelho moderado e origem no detalhe | Histórico preservado |
| Concluído | cinza neutro | Não cancelado e fim no passado |
| Inativo | vermelho suave e texto | Bloco retirado da agenda |
| Passado | cinza de baixa ênfase | Horário expirado |

## Redução de erros operacionais

1. Resumo antes de agendar.
2. Nova checagem de disponibilidade na confirmação.
3. Consequência de cada origem de cancelamento descrita antes da ação.
4. Duplicidade de cliente é alerta confirmável, não bloqueio silencioso.
5. Exclusões vinculadas são bloqueadas com motivo.
6. Cadastro em lote exige prévia e validação individual.
7. Desativação de horário com agendamento ativo orienta cancelar primeiro.
8. Estados usam texto e não dependem apenas de cor.

## Pontos que dependem de aprovação da equipe

- Quantidade definitiva de registros por página.
- Se a listagem inicial de agendamentos deve incluir históricos ou iniciar apenas nos próximos.
- Formato preferido do filtro de intervalo de datas: dois campos ou calendário com intervalo.
- Se conflitos do lote devem bloquear toda a operação ou permitir criar somente os blocos válidos. O protótipo demonstra criação dos válidos, mas a documentação original indica ajuste antes da conclusão; a decisão final precisa ser explícita.
- Se “especialidades relacionadas” no resumo deve listar todas as especialidades do médico ou somente a usada como filtro.
- Terminologia final para o ator na interface (“Secretário”, “Recepção” ou linguagem neutra), sem alterar o modelo de permissões, que não existe no escopo.
