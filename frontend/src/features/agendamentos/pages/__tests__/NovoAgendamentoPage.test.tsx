import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/api";
import type {
	ClienteResponse,
	EspecialidadeResponse,
	HorarioDisponivelResponse,
	MedicoResponse,
} from "@/api/generated";
import { ToastProvider } from "@/components/ui/Toast";
import { clienteService } from "@/features/clientes/services/clientes.service";
import * as schedulesApi from "@/features/horarios/api/availableSchedulesApi";
import * as appointmentsApi from "../../api/appointmentsApi";
import { NovoAgendamentoPage } from "../NovoAgendamentoPage";

vi.mock("@/features/clientes/services/clientes.service", () => ({
	clienteService: {
		listClients: vi.fn(),
	},
}));

vi.mock("@/features/horarios/api/availableSchedulesApi", () => ({
	listSpecialties: vi.fn(),
	listDoctors: vi.fn(),
	listAvailableSchedules: vi.fn(),
}));

vi.mock("../../api/appointmentsApi", () => ({
	criarAgendamento: vi.fn(),
	getAgendamentoErrorMessage: vi.fn((err: unknown, fallback: string) =>
		err instanceof Error ? err.message : fallback,
	),
}));

const mockClients: ClienteResponse[] = [
	{
		id: "c1-uuid",
		nome: "Ana Paula Ribeiro",
		telefone: "(85) 98841-2030",
		email: "ana.ribeiro@email.com",
		data_nascimento: "1987-03-12",
	},
	{
		id: "c2-uuid",
		nome: "Bruno Henrique Lima",
		telefone: "(85) 99620-1147",
		email: "bruno.lima@email.com",
		data_nascimento: "1992-09-25",
	},
];

const mockSpecialties: EspecialidadeResponse[] = [
	{ id: "spec-cardio", nome: "Cardiologia" },
	{ id: "spec-derma", nome: "Dermatologia" },
];

const mockDoctors: MedicoResponse[] = [
	{
		id: "doc-mariana",
		nome: "Dra. Mariana Alves",
		especialidades: [{ id: "spec-cardio", nome: "Cardiologia" }],
	},
	{
		id: "doc-rafael",
		nome: "Dr. Rafael Monteiro",
		especialidades: [{ id: "spec-derma", nome: "Dermatologia" }],
	},
];

const mockSchedules: HorarioDisponivelResponse[] = [
	{
		id: "slot-1",
		inicio: "2026-09-10T08:00:00Z",
		fim: "2026-09-10T09:00:00Z",
		medico: { id: "doc-mariana", nome: "Dra. Mariana Alves" },
	},
	{
		id: "slot-2",
		inicio: "2026-09-10T09:00:00Z",
		fim: "2026-09-10T10:00:00Z",
		medico: { id: "doc-mariana", nome: "Dra. Mariana Alves" },
	},
];

function renderComponent(initialRoute = "/agendamentos/novo") {
	return render(
		<ToastProvider>
			<MemoryRouter initialEntries={[initialRoute]}>
				<Routes>
					<Route path="/agendamentos/novo" element={<NovoAgendamentoPage />} />
					<Route
						path="/agendamentos"
						element={<div>Página de Agendamentos</div>}
					/>
					<Route
						path="/clientes/cadastro"
						element={<div>Cadastro de Cliente</div>}
					/>
				</Routes>
			</MemoryRouter>
		</ToastProvider>,
	);
}

describe("NovoAgendamentoPage — Fluxo de Realização de Agendamento #42", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(clienteService.listClients).mockResolvedValue({
			items: mockClients,
			next_cursor: null,
		});
		vi.mocked(schedulesApi.listSpecialties).mockResolvedValue(mockSpecialties);
		vi.mocked(schedulesApi.listDoctors).mockResolvedValue(mockDoctors);
		vi.mocked(schedulesApi.listAvailableSchedules).mockResolvedValue(
			mockSchedules,
		);
	});

	it("renderiza cabeçalho, stepper, avisos iniciais e botão cancelar", async () => {
		renderComponent();

		expect(
			screen.getByRole("heading", { level: 1, name: "Novo agendamento" }),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute(
			"href",
			"/agendamentos",
		);
		expect(
			screen.getByRole("region", { name: "Progresso do agendamento" }),
		).toBeInTheDocument();
		expect(screen.getByText("1 · Cliente")).toBeInTheDocument();
		expect(screen.getByText("2 · Agenda")).toBeInTheDocument();
		expect(screen.getByText("3 · Horário")).toBeInTheDocument();
		expect(screen.getByText("4 · Revisão")).toBeInTheDocument();

		// Sem busca ativa, não exibe lista cheia de clientes
		expect(
			await screen.findByText("Pesquise para selecionar um cliente"),
		).toBeInTheDocument();
		expect(screen.getByText("Nenhum filtro selecionado")).toBeInTheDocument();
	});

	it("carrega e permite buscar/filtrar clientes cadastrados somente após pesquisa", async () => {
		const user = userEvent.setup();
		renderComponent();

		expect(
			await screen.findByText("Pesquise para selecionar um cliente"),
		).toBeInTheDocument();

		const searchInput = screen.getByLabelText("Buscar cliente");
		await user.type(searchInput, "Bruno");

		expect(screen.queryByText("Ana Paula Ribeiro")).not.toBeInTheDocument();
		expect(screen.getByText("Bruno Henrique Lima")).toBeInTheDocument();
	});

	it("seleciona um cliente via busca e atualiza o resumo e o stepper", async () => {
		const user = userEvent.setup();
		renderComponent();

		const searchInput = screen.getByLabelText("Buscar cliente");
		await user.type(searchInput, "Ana");

		const clientOption = await screen.findByRole("option", {
			name: /Ana Paula Ribeiro/i,
		});
		await user.click(clientOption);

		expect(clientOption).toHaveAttribute("aria-selected", "true");
		expect(screen.getByText("Selecionado")).toBeInTheDocument();

		const summaryClient = document.getElementById("summary-client");
		expect(summaryClient).toHaveTextContent("Ana Paula Ribeiro");
	});

	it("carrega especialidades e médicos e filtra médicos ao selecionar especialidade", async () => {
		const user = userEvent.setup();
		renderComponent();

		await waitFor(() => {
			expect(screen.getByLabelText("Especialidade")).toBeInTheDocument();
		});

		const specialtySelect = screen.getByLabelText("Especialidade");
		await user.selectOptions(specialtySelect, "spec-derma");

		const doctorSelect = screen.getByLabelText("Médico");
		expect(withinSelectHasOption(doctorSelect, "Dr. Rafael Monteiro")).toBe(
			true,
		);
		expect(withinSelectHasOption(doctorSelect, "Dra. Mariana Alves")).toBe(
			false,
		);

		function withinSelectHasOption(
			select: HTMLElement,
			optionText: string,
		): boolean {
			const options = Array.from((select as HTMLSelectElement).options).map(
				(o) => o.text,
			);
			return options.includes(optionText);
		}
	});

	it("consulta horários disponíveis através da API quando ao menos um filtro é aplicado", async () => {
		const user = userEvent.setup();
		renderComponent();

		await waitFor(() => {
			expect(screen.getByLabelText("Especialidade")).toBeInTheDocument();
		});

		await user.selectOptions(
			screen.getByLabelText("Especialidade"),
			"spec-cardio",
		);
		await user.selectOptions(screen.getByLabelText("Médico"), "doc-mariana");
		await user.type(screen.getByLabelText("Data"), "2026-09-10");

		await waitFor(() => {
			expect(schedulesApi.listAvailableSchedules).toHaveBeenCalledWith({
				especialidadeId: "spec-cardio",
				medicoId: "doc-mariana",
				data: "2026-09-10",
			});
		});

		expect(
			screen.getByRole("button", { name: /08:00–09:00/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /09:00–10:00/i }),
		).toBeInTheDocument();
	});

	it("renderiza detalhes ricos no card do horário (médico, especialidade, data e horário)", async () => {
		const user = userEvent.setup();
		renderComponent();

		await waitFor(() => {
			expect(screen.getByLabelText("Especialidade")).toBeInTheDocument();
		});

		await user.selectOptions(
			screen.getByLabelText("Especialidade"),
			"spec-cardio",
		);

		const slotButton = await screen.findByRole("button", {
			name: /08:00–09:00/i,
		});
		expect(slotButton).toHaveTextContent("Dra. Mariana Alves");
		expect(slotButton).toHaveTextContent("Cardiologia");
		expect(slotButton).toHaveTextContent("08:00–09:00");
		expect(slotButton).toHaveTextContent("Disponível");
	});

	it("permite selecionar um horário e exibe todos os dados na revisão", async () => {
		const user = userEvent.setup();
		renderComponent();

		// Busca e seleciona cliente
		await user.type(screen.getByLabelText("Buscar cliente"), "Ana");
		await user.click(
			await screen.findByRole("option", { name: /Ana Paula Ribeiro/i }),
		);

		// Seleciona especialidade para carregar horários
		await user.selectOptions(
			screen.getByLabelText("Especialidade"),
			"spec-cardio",
		);

		// Seleciona horário
		const slotBtn = await screen.findByRole("button", {
			name: /08:00–09:00/i,
		});
		await user.click(slotBtn);

		expect(slotBtn).toHaveAttribute("aria-pressed", "true");
		expect(slotBtn).toHaveTextContent("Selecionado");

		// Verifica card de revisão
		expect(document.getElementById("summary-client")).toHaveTextContent(
			"Ana Paula Ribeiro",
		);
		expect(document.getElementById("summary-specialty")).toHaveTextContent(
			"Cardiologia",
		);
		expect(document.getElementById("summary-doctor")).toHaveTextContent(
			"Dra. Mariana Alves",
		);
		expect(document.getElementById("summary-time")).toHaveTextContent(
			"08:00–09:00",
		);

		const confirmBtn = screen.getByRole("button", {
			name: "Confirmar agendamento",
		});
		expect(confirmBtn).not.toBeDisabled();
	});

	it("mantém botão de confirmação desabilitado sem cliente ou horário selecionados", async () => {
		const user = userEvent.setup();
		renderComponent();

		const confirmBtn = screen.getByRole("button", {
			name: "Confirmar agendamento",
		});
		expect(confirmBtn).toBeDisabled();

		// Seleciona apenas o cliente
		await user.type(screen.getByLabelText("Buscar cliente"), "Ana");
		await user.click(
			await screen.findByRole("option", { name: /Ana Paula Ribeiro/i }),
		);

		expect(confirmBtn).toBeDisabled();
	});

	it("confirmação bem-sucedida envia payload correto, exibe loading, bloqueia submissão simultânea e navega", async () => {
		const user = userEvent.setup();
		vi.mocked(appointmentsApi.criarAgendamento).mockImplementation(
			async () =>
				new Promise((resolve) =>
					setTimeout(
						() =>
							resolve({
								id: "agendamento-123",
								cliente_id: "c1-uuid",
								horario_id: "slot-1",
								status: "AGENDADO",
								criado_em: "2026-08-15T10:00:00Z",
							}),
						100,
					),
				),
		);

		renderComponent();

		await user.type(screen.getByLabelText("Buscar cliente"), "Ana");
		await user.click(
			await screen.findByRole("option", { name: /Ana Paula Ribeiro/i }),
		);
		await user.selectOptions(
			screen.getByLabelText("Especialidade"),
			"spec-cardio",
		);
		await user.click(
			await screen.findByRole("button", { name: /08:00–09:00/i }),
		);

		const confirmBtn = screen.getByRole("button", {
			name: "Confirmar agendamento",
		});
		await user.click(confirmBtn);

		// Loading ativo no botão
		expect(screen.getByText("Confirmando agendamento...")).toBeInTheDocument();
		expect(confirmBtn).toBeDisabled();

		// Tentativa de clique duplo bloqueada
		await user.click(confirmBtn);
		expect(appointmentsApi.criarAgendamento).toHaveBeenCalledTimes(1);
		expect(appointmentsApi.criarAgendamento).toHaveBeenCalledWith({
			cliente_id: "c1-uuid",
			horario_id: "slot-1",
		});

		// Aguarda redirecionamento após sucesso
		await waitFor(() => {
			expect(screen.getByText("Página de Agendamentos")).toBeInTheDocument();
		});
	});

	it("trata conflito HTTP 409: abre modal de conflito, não sinaliza sucesso, atualiza horários e permite selecionar outro bloco", async () => {
		const user = userEvent.setup();
		vi.mocked(appointmentsApi.criarAgendamento).mockRejectedValueOnce(
			new ApiError(
				409,
				JSON.stringify({ detail: "Horário não está mais disponível" }),
			),
		);

		renderComponent();

		await user.type(screen.getByLabelText("Buscar cliente"), "Ana");
		await user.click(
			await screen.findByRole("option", { name: /Ana Paula Ribeiro/i }),
		);
		await user.selectOptions(
			screen.getByLabelText("Especialidade"),
			"spec-cardio",
		);
		await user.click(
			await screen.findByRole("button", { name: /08:00–09:00/i }),
		);

		await user.click(
			screen.getByRole("button", { name: "Confirmar agendamento" }),
		);

		// Modal de conflito exibido
		await waitFor(() => {
			expect(
				screen.getByRole("alertdialog", {
					name: "Horário não está mais disponível",
				}),
			).toBeInTheDocument();
		});

		expect(screen.getByText("Conflito em 08:00–09:00")).toBeInTheDocument();
		expect(
			screen.queryByText("Página de Agendamentos"),
		).not.toBeInTheDocument();

		// Cliente permanece selecionado no resumo
		expect(document.getElementById("summary-client")).toHaveTextContent(
			"Ana Paula Ribeiro",
		);

		// Atualizar horários no modal
		const refreshBtn = screen.getByRole("button", {
			name: "Atualizar horários",
		});
		await user.click(refreshBtn);

		expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

		// Seleciona outro bloco disponível (slot-2)
		const otherSlot = await screen.findByRole("button", {
			name: /09:00–10:00/i,
		});
		await user.click(otherSlot);

		expect(document.getElementById("summary-time")).toHaveTextContent(
			"09:00–10:00",
		);
	});

	it("trata erro inesperado mantendo dados selecionados e exibindo mensagem amigável", async () => {
		const user = userEvent.setup();
		vi.mocked(appointmentsApi.criarAgendamento).mockRejectedValueOnce(
			new Error("Falha interna do servidor."),
		);

		renderComponent();

		await user.type(screen.getByLabelText("Buscar cliente"), "Ana");
		await user.click(
			await screen.findByRole("option", { name: /Ana Paula Ribeiro/i }),
		);
		await user.selectOptions(
			screen.getByLabelText("Especialidade"),
			"spec-cardio",
		);
		await user.click(
			await screen.findByRole("button", { name: /08:00–09:00/i }),
		);

		await user.click(
			screen.getByRole("button", { name: "Confirmar agendamento" }),
		);

		await waitFor(() => {
			expect(screen.getByRole("alert")).toBeInTheDocument();
		});

		expect(screen.getByText("Falha interna do servidor.")).toBeInTheDocument();

		// Dados continuam preservados
		expect(document.getElementById("summary-client")).toHaveTextContent(
			"Ana Paula Ribeiro",
		);
		expect(document.getElementById("summary-time")).toHaveTextContent(
			"08:00–09:00",
		);
	});

	it("pré-preenche especialidade, médico, data e horário a partir de query params", async () => {
		renderComponent(
			"/agendamentos/novo?especialidade=Cardiologia&medico=Dra.%20Mariana%20Alves&data=2026-09-10&horario=slot-1",
		);

		await waitFor(() => {
			expect(
				screen.getByText("Horário carregado da agenda"),
			).toBeInTheDocument();
		});

		expect(screen.getByLabelText("Especialidade")).toHaveValue("spec-cardio");
		expect(screen.getByLabelText("Médico")).toHaveValue("doc-mariana");
		expect(screen.getByLabelText("Data")).toHaveValue("2026-09-10");

		await waitFor(() => {
			expect(document.getElementById("summary-doctor")).toHaveTextContent(
				"Dra. Mariana Alves",
			);
			expect(document.getElementById("summary-time")).toHaveTextContent(
				"08:00–09:00",
			);
		});
	});

	it("preenche a especialidade no resumo a partir do médico do horário mesmo quando o filtro de especialidade não foi selecionado", async () => {
		const user = userEvent.setup();
		renderComponent();

		await waitFor(() => {
			expect(screen.getByLabelText("Data")).toBeInTheDocument();
		});

		// Filtra apenas por Data (sem especialidade e sem médico)
		await user.type(screen.getByLabelText("Data"), "2026-09-10");

		const slotBtn = await screen.findByRole("button", {
			name: /08:00–09:00/i,
		});
		await user.click(slotBtn);

		// Especialidade é resolvida automaticamente a partir do médico do horário (Dra. Mariana Alves -> Cardiologia)
		expect(document.getElementById("summary-specialty")).toHaveTextContent(
			"Cardiologia",
		);
		expect(document.getElementById("summary-doctor")).toHaveTextContent(
			"Dra. Mariana Alves",
		);
	});
});
