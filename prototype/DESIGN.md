# Sistema visual — Clínica Aurora

## 1. Princípios

1. **Operação antes de ornamentação.** A tela deve tornar a próxima ação e o estado do dado evidentes sem depender de gráficos decorativos.
2. **Calma com densidade útil.** Superfícies claras, bordas finas e espaçamento consistente ajudam a equipe a percorrer tabelas e formulários sem ruído.
3. **Regras visíveis no ponto da decisão.** Disponibilidade, conflito, duplicidade e consequência do cancelamento aparecem antes da confirmação.
4. **Texto acompanha cor.** Todo estado possui rótulo, ponto visual e linguagem explícita.
5. **Hierarquia estável.** Navegação lateral, cabeçalho contextual, título, filtros e conteúdo seguem a mesma ordem em todas as telas.

## 2. Personalidade

Profissional, sóbria, acolhedora e eficiente. A interface evita a estética hospitalar, não usa cruzes médicas, não depende de excesso de azul e não apresenta elementos de marketing. O produto deve parecer plausível para uma equipe pequena implementar e manter.

## 3. Paleta

Os tokens principais usam OKLCH para manter contraste e permitir derivações previsíveis.

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `oklch(97.8% 0.006 210)` | Fundo geral levemente frio |
| `--surface` | `oklch(100% 0 0)` | Tabelas, formulários e modais |
| `--fg` | `oklch(23% 0.025 220)` | Texto primário |
| `--muted` | `oklch(50% 0.025 220)` | Legendas e texto secundário |
| `--border` | `oklch(89% 0.012 215)` | Divisores e contornos |
| `--accent` | `oklch(48% 0.085 185)` | Ação principal e navegação ativa |
| `--secondary` | `oklch(67% 0.10 78)` | Destaque moderado |
| `--success` | `oklch(52% 0.11 155)` | Confirmação |
| `--warning` | `oklch(64% 0.12 75)` | Atenção e horário ocupado |
| `--danger` | `oklch(52% 0.15 28)` | Erro, cancelamento e ação destrutiva |
| `--info` | `oklch(52% 0.10 235)` | Informação contextual |

Derivações como fundos suaves devem usar `color-mix()` a partir desses tokens. Não introduzir cores literais fora do bloco de tokens.

## 4. Tipografia

- **Display:** Iowan Old Style, Charter, Georgia, serif. Usada em títulos de página e seções para produzir uma voz calma sem parecer um dashboard genérico.
- **Corpo:** pilha de sistema (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `system-ui`).
- **Dados:** `ui-monospace`, SFMono-Regular, Menlo. Usada em horários, datas, quantidades e identificadores.
- Título de página: `clamp(30px, 3vw, 42px)`, linha 1,08.
- Título de seção: `clamp(24px, 2.2vw, 32px)`.
- Corpo: 16px; controles e tabelas: 14px; metadados: 11–13px.

## 5. Espaçamento

Escala baseada em 4 e 8 pontos: `4, 8, 12, 16, 18, 24, 32, 40, 48, 64` px. Controles mantêm altura mínima de 42px no desktop e áreas clicáveis de aproximadamente 44px. A área principal utiliza preenchimento fluido entre 24 e 48px.

## 6. Bordas, raios e sombras

- Campos e botões: 9–10px.
- Cartões e tabelas: 16px.
- Modais: 18px.
- Badges: raio total.
- Bordas: 1px, usando `--border`.
- Sombras são reservadas a modais, menu móvel e toast. Conteúdo normal usa borda e espaço, não elevação.

## 7. Grid e largura

- Sidebar desktop: 248px; modo compacto entre 761 e 1100px: 88px.
- Conteúdo máximo: 1440px.
- Painel principal: coluna de trabalho flexível e coluna auxiliar mínima de 280px.
- Formulários: duas colunas no desktop; uma coluna em telas estreitas.
- Tabelas mantêm largura mínima e rolagem horizontal quando a conversão para cartões reduziria a comparabilidade.

## 8. Ícones

Ícones monoline, 18px, `stroke-width` 1,8, sem preenchimento decorativo. São auxiliares da navegação e nunca substituem rótulos. Não usar emoji como ícone funcional.

## 9. Componentes

### Navegação e estrutura

- Sidebar fixa no desktop, compacta em tablet e drawer em telas estreitas.
- Topbar fixa com breadcrumb e data operacional.
- Cabeçalho de página com título, descrição e ações primárias.

### Controles

- Botões primário, secundário, fantasma e destrutivo.
- Campos com label explícito, indicação de obrigatório, ajuda e erro associado.
- Seleção simples via `select`; múltipla via checkboxes/chips.
- Segmentado apenas para alternar cadastro individual e em lote.

### Dados

- Tabela com cabeçalho fixo, numerais monoespaçados e ações na última coluna.
- Em horários disponíveis, “Marcar horário” é a ação contextual principal e “Desativar” permanece secundária; o primeiro atalho transporta médico, especialidade, data e intervalo para o formulário de agendamento.
- Badge de status com texto + ponto, nunca somente cor.
- Paginação com quantidade fixa de registros indicada.
- Estado vazio com causa e próximo passo.

### Feedback

- Alertas persistentes para regras que exigem leitura.
- Toast para sucesso local e confirmação de simulação.
- Modal para cancelamento, desativação e exclusão.
- Conflitos usam mensagem direta, consequência e ação de recuperação.

## 10. Estados de interação

- `hover`: leve mudança de borda ou fundo.
- `focus-visible`: contorno de 3px derivado do accent.
- `active`: deslocamento vertical de 1px em botões.
- `disabled`: opacidade reduzida e cursor bloqueado.
- `error`: borda danger, mensagem específica e vínculo textual com o campo.
- `success`: confirmação curta sem ocultar a regra aplicada.

## 11. Estados do domínio

- **AGENDADO:** verde-petróleo, rótulo e ponto. Continua assim até o fim do horário.
- **CANCELADO:** vermelho moderado. Mantém histórico e mostra origem quando disponível.
- **CONCLUIDO:** cinza neutro. É calculado quando o agendamento não foi cancelado e o horário terminou.
- **DISPONIVEL:** verde-petróleo e borda tracejada na agenda. Derivado de ativo + futuro + sem agendamento AGENDADO.
- **OCUPADO:** âmbar e identificação do cliente. Derivado da existência de agendamento ativo.
- **INATIVO:** vermelho suave e texto explícito; não aceita novos agendamentos.
- **PASSADO:** neutro e baixa ênfase; não pode receber novos agendamentos.

## 12. Responsividade

- **Acima de 1100px:** sidebar completa, tabelas e formulários em duas colunas.
- **761–1100px:** sidebar compacta com ícones; painéis auxiliares descem para uma coluna.
- **Até 760px:** menu lateral em drawer, cabeçalho compacto, ações em largura útil, formulários e métricas em uma coluna.
- Tabelas críticas preservam comparação por rolagem horizontal.
- Filtros podem ser agrupados quando a tela evoluir para React; o protótipo mantém controles empilháveis.

## 13. Acessibilidade

- HTML em `pt-BR`, labels explícitos, títulos de modal e `aria-modal`.
- Link “Pular para o conteúdo”.
- Foco visível e fechamento de modais por `Esc`.
- Contraste projetado para WCAG AA em texto normal.
- Estados sempre combinam cor, texto e forma.
- Preferência `prefers-reduced-motion` desativa animações e transições.
- Confirmação obrigatória para ações destrutivas.

## 14. Orientações para React

- Separar `AppShell`, `Sidebar`, `PageHeader`, `FilterBar`, `DataTable`, `StatusBadge`, `Modal`, `Toast`, `EmptyState`, `ScheduleGrid` e campos de formulário.
- Manter dados de domínio fora dos componentes visuais; o protótipo centraliza mocks em `ClinicData` apenas para demonstração.
- Representar filtros na URL quando a aplicação real exigir compartilhamento de contexto.
- Usar formulários controlados e um schema de validação compartilhável com os contratos da API.
- Calcular a apresentação de disponibilidade e `CONCLUIDO` a partir dos campos recebidos, mas tratar o backend FastAPI como autoridade no momento de confirmar.
- Mapear erros de conflito da API para mensagens específicas junto ao horário selecionado.
- Não adicionar autenticação, perfis, pagamentos, prontuário ou notificações sem mudança formal de escopo.
