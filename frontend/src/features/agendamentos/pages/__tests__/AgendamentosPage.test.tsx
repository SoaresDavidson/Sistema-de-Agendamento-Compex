import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/Toast";
import type { Appointment, PaginatedResponse } from "../../api/types";
import { AgendamentosPage } from "../AgendamentosPage";

function renderPage() {
	return render(
		<ToastProvider>
			<MemoryRouter>
				<AgendamentosPage />
			</MemoryRouter>
		</ToastProvider>,
	);
}

function botaoCancelarDe(cliente: string) {
	const row = screen.getByText(cliente).closest("tr");
	if (!row) throw new Error(`Linha não encontrada para ${cliente}`);
	return within(row).getByRole("button", { name: /Cancelar/i });
}

const page1: Appointment[] = [
	{
		id: "p1-1",
		cliente: "Cliente 1",
		medico: "Médico 1",
		especialidade: "Esp 1",
		data: "10/08/2026",
		horario: "08:00–09:00",
		status: "AGENDADO",
	},
	{
		id: "p1-2",
		cliente: "Cliente 2",
		medico: "Médico 2",
		especialidade: "Esp 2",
		data: "10/08/2026",
		horario: "09:00–10:00",
		status: "AGENDADO",
	},
	{
		id: "p1-3",
		cliente: "Cliente 3",
		medico: "Médico 3",
		especialidade: "Esp 3",
		data: "10/08/2026",
		horario: "10:00–11:00",
		status: "AGENDADO",
	},
	{
		id: "p1-4",
		cliente: "Cliente 4",
		medico: "Médico 4",
		especialidade: "Esp 4",
		data: "10/08/2026",
		horario: "11:00–12:00",
		status: "AGENDADO",
	},
	{
		id: "p1-5",
		cliente: "Cliente 5",
		medico: "Médico 5",
		especialidade: "Esp 5",
		data: "10/08/2026",
		horario: "13:00–14:00",
		status: "AGENDADO",
	},
];
const page2: Appointment[] = [
	{
		id: "p2-1",
		cliente: "Cliente 6",
		medico: "Médico 6",
		especialidade: "Esp 6",
		data: "11/08/2026",
		horario: "08:00–09:00",
		status: "CONCLUIDO",
	},
	{
		id: "p2-2",
		cliente: "Cliente 7",
		medico: "Médico 7",
		especialidade: "Esp 7",
		data: "11/08/2026",
		horario: "09:00–10:00",
		status: "CANCELADO",
	},
];

const { mockListAppointments, mockCancelarAgendamento } = vi.hoisted(() => ({
	mockListAppointments: vi.fn(),
	mockCancelarAgendamento: vi.fn(),
}));

const { mockListMedicos, mockListEspecialidades } = vi.hoisted(() => ({
	mockListMedicos: vi.fn(),
	mockListEspecialidades: vi.fn(),
}));

vi.mock("../../api/appointmentsApi", async (importOriginal) => {
	const mod =
		await importOriginal<typeof import("../../api/appointmentsApi")>();
	return {
		...mod,
		listAppointments: mockListAppointments,
		cancelarAgendamento: mockCancelarAgendamento,
	};
});

vi.mock("@/features/medicos/services/medicos.service", () => ({
	medicosService: {
		list: mockListMedicos,
		listEspecialidades: mockListEspecialidades,
	},
}));

function buildResponse(page: number): PaginatedResponse<Appointment> {
	return {
		items: page === 1 ? page1 : page2,
		page,
		size: 5,
		total: 7,
		totalPages: 2,
	};
}

function mockFilterOptions() {
	mockListMedicos.mockReset();
	mockListMedicos.mockResolvedValue({
		items: [
			{
				nome: "Dr. Rafael Monteiro",
				id: "3cf086da-49a6-558e-ac68-0897b0ca1408",
				especialidades: [],
			},
			{
				nome: "Dra. Mariana Alves",
				id: "b6e4f0c4-8342-52c1-9f3a-5a4b6c7d8e9f",
				especialidades: [],
			},
		],
		next_cursor: null,
	});
	mockListEspecialidades.mockReset();
	mockListEspecialidades.mockResolvedValue([
		{ nome: "Cardiologia", id: "b6e4f0c4-8342-52c1-9f3a-5a4b6c7d8e9a" },
		{ nome: "Dermatologia", id: "b1f4738d-61c0-5b5b-8a8e-613752ba043f" },
	]);
}

describe("AgendamentosPage — integração de paginação", () => {
	beforeEach(() => {
		mockFilterOptions();
		mockListAppointments.mockReset();
		mockListAppointments.mockImplementation(async ({ page }) =>
			Promise.resolve(buildResponse(page)),
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("renderiza a primeira página com 5 registros", async () => {
		renderPage();
		expect(await screen.findByText("Cliente 1")).toBeInTheDocument();
		const rows = screen.getAllByRole("row").slice(1);
		expect(rows).toHaveLength(5);
		expect(
			screen.getByText((content) => content.includes("Página 1 de 2")),
		).toBeInTheDocument();
		expect(mockListAppointments).toHaveBeenCalledWith({
			page: 1,
			size: 5,
			filters: {},
		});
	});

	it("ao clicar na página 2, busca novos registros e atualiza a contagem", async () => {
		const user = userEvent.setup();
		renderPage();

		await screen.findByText("Cliente 1");
		mockListAppointments.mockClear();

		await user.click(screen.getByRole("button", { name: "Página 2" }));

		expect(await screen.findByText("Cliente 6")).toBeInTheDocument();
		expect(mockListAppointments).toHaveBeenCalledWith({
			page: 2,
			size: 5,
			filters: {},
		});

		const rows = screen.getAllByRole("row").slice(1);
		expect(rows).toHaveLength(2);
		expect(
			screen.getByText((content) => content.includes("Página 2 de 2")),
		).toBeInTheDocument();
		expect(within(rows[1]).getByText("Cliente 7")).toBeInTheDocument();
	});

	it("botão de página anterior fica desabilitado na primeira página", async () => {
		renderPage();
		await screen.findByText("Cliente 1");
		expect(
			screen.getByRole("button", {
				name: "Página anterior",
			}),
		).toBeDisabled();
	});
});

describe("AgendamentosPage — filtros da listagem", () => {
	beforeEach(() => {
		mockFilterOptions();
		mockListAppointments.mockReset();
		mockListAppointments.mockImplementation(async ({ page }) =>
			Promise.resolve(buildResponse(page)),
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("renderiza o toolbar de filtros com os 6 campos acima da tabela", async () => {
		renderPage();
		await screen.findByText("Cliente 1");
		expect(screen.getByLabelText("Buscar cliente")).toBeInTheDocument();
		expect(screen.getByLabelText("Médico")).toBeInTheDocument();
		expect(screen.getByLabelText("Especialidade")).toBeInTheDocument();
		expect(screen.getByLabelText("Status")).toBeInTheDocument();
		expect(screen.getByLabelText("Data")).toBeInTheDocument();
	});

	it("popula os selects de Médico e Especialidade com as opções do backend", async () => {
		renderPage();
		await screen.findByText("Cliente 1");

		const medicoOptions = within(screen.getByLabelText("Médico")).getAllByRole(
			"option",
		);
		expect(medicoOptions.map((o) => o.textContent)).toEqual([
			"Todos",
			"Dr. Rafael Monteiro",
			"Dra. Mariana Alves",
		]);

		const especialidadeOptions = within(
			screen.getByLabelText("Especialidade"),
		).getAllByRole("option");
		expect(especialidadeOptions.map((o) => o.textContent)).toEqual([
			"Todas",
			"Cardiologia",
			"Dermatologia",
		]);
	});

	it("alterar o select de Médico dispara chamada com filtro e volta para página 1", async () => {
		const user = userEvent.setup();
		renderPage();
		await screen.findByText("Cliente 1");
		mockListAppointments.mockClear();

		await user.selectOptions(
			screen.getByLabelText("Médico"),
			"Dr. Rafael Monteiro",
		);

		await vi.waitFor(() => {
			expect(mockListAppointments).toHaveBeenCalledWith({
				page: 1,
				size: 5,
				filters: { medico: "Dr. Rafael Monteiro" },
			});
		});
	});

	it("alterar o select de Especialidade dispara chamada com filtro e volta para página 1", async () => {
		const user = userEvent.setup();
		renderPage();
		await screen.findByText("Cliente 1");
		mockListAppointments.mockClear();

		await user.selectOptions(
			screen.getByLabelText("Especialidade"),
			"Cardiologia",
		);

		await vi.waitFor(() => {
			expect(mockListAppointments).toHaveBeenCalledWith({
				page: 1,
				size: 5,
				filters: { especialidade: "Cardiologia" },
			});
		});
	});

	it("alterar o select de Status dispara chamada com filtro e volta para página 1", async () => {
		const user = userEvent.setup();
		renderPage();
		await screen.findByText("Cliente 1");
		await user.click(screen.getByRole("button", { name: "Página 2" }));
		await screen.findByText("Cliente 6");
		mockListAppointments.mockClear();

		await user.selectOptions(screen.getByLabelText("Status"), "AGENDADO");

		expect(mockListAppointments).toHaveBeenCalledWith({
			page: 1,
			size: 5,
			filters: { status: "AGENDADO" },
		});
	});

	it("digitar no campo de cliente aplica debounce de 300ms antes de buscar", async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		vi.clearAllMocks();
		mockListAppointments.mockImplementation(async ({ page }) =>
			Promise.resolve(buildResponse(page)),
		);

		const user = userEvent.setup({
			advanceTimers: vi.advanceTimersByTime.bind(vi),
		});
		renderPage();
		// aguarda a chamada inicial (sem filtros)
		await vi.waitFor(() => {
			expect(mockListAppointments).toHaveBeenCalledWith({
				page: 1,
				size: 5,
				filters: {},
			});
		});
		mockListAppointments.mockClear();

		const input = screen.getByLabelText("Buscar cliente");
		await user.type(input, "Ana");

		// imediatamente após digitar, nenhuma chamada com filtro
		expect(mockListAppointments).not.toHaveBeenCalled();
		// aguarda o debounce
		await vi.advanceTimersByTimeAsync(350);

		await vi.waitFor(() => {
			expect(mockListAppointments).toHaveBeenCalledWith({
				page: 1,
				size: 5,
				filters: { cliente: "Ana" },
			});
		});

		vi.useRealTimers();
	});

	it("botão Limpar zera filtros e volta para página 1", async () => {
		const user = userEvent.setup();
		renderPage();
		await screen.findByText("Cliente 1");

		await user.type(screen.getByLabelText("Buscar cliente"), "Ana");
		await new Promise((r) => setTimeout(r, 350));
		await screen.findByText("Cliente 1");
		mockListAppointments.mockClear();

		await user.click(screen.getByRole("button", { name: "Limpar" }));

		await vi.waitFor(() => {
			expect(mockListAppointments).toHaveBeenCalledWith({
				page: 1,
				size: 5,
				filters: {},
			});
		});
	});

	it("filtro por data dispara chamada com data em ISO", async () => {
		const user = userEvent.setup();
		renderPage();
		await screen.findByText("Cliente 1");
		mockListAppointments.mockClear();

		await user.type(screen.getByLabelText("Data"), "2026-08-10");

		await vi.waitFor(() => {
			expect(mockListAppointments).toHaveBeenCalledWith({
				page: 1,
				size: 5,
				filters: { data: "2026-08-10" },
			});
		});
	});
});

describe("AgendamentosPage — estado de carregamento", () => {
	beforeEach(() => {
		mockFilterOptions();
		mockListAppointments.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("exibe skeleton durante a busca inicial e some ao chegar os dados", async () => {
		// trava a primeira chamada (inicial) para observarmos o skeleton
		let resolveList!: (r: PaginatedResponse<Appointment>) => void;
		mockListAppointments.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveList = resolve;
				}),
		);

		renderPage();

		// durante o carregamento inicial: skeleton visível, sem tabela
		await vi.waitFor(() => {
			expect(
				document.querySelectorAll('[data-slot="skeleton"]').length,
			).toBeGreaterThan(0);
		});
		expect(screen.getByText("—")).toBeInTheDocument();
		expect(screen.queryByRole("table")).toBeNull();

		// ao resolver a promise: dados aparecem, skeleton some
		resolveList(buildResponse(1));
		expect(await screen.findByText("Cliente 1")).toBeInTheDocument();
		expect(screen.getByText("7 resultados")).toBeInTheDocument();
		expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(0);
	});

	it("exibe skeleton ao trocar de página", async () => {
		const user = userEvent.setup();
		mockListAppointments.mockImplementation(async ({ page }) =>
			Promise.resolve(buildResponse(page)),
		);

		renderPage();
		await screen.findByText("Cliente 1");

		// segunda chamada (página 2) fica pendente
		let resolvePage2!: (r: PaginatedResponse<Appointment>) => void;
		mockListAppointments.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolvePage2 = resolve;
				}),
		);
		await user.click(screen.getByRole("button", { name: "Página 2" }));

		// skeleton voltou a aparecer durante o flip de página
		await vi.waitFor(() => {
			expect(
				document.querySelectorAll('[data-slot="skeleton"]').length,
			).toBeGreaterThan(0);
		});
		expect(screen.queryByText("Cliente 6")).toBeNull();

		resolvePage2(buildResponse(2));
		expect(await screen.findByText("Cliente 6")).toBeInTheDocument();
	});

	it("exibe skeleton ao aplicar filtro (select de status)", async () => {
		const user = userEvent.setup();
		mockListAppointments.mockImplementation(async ({ page }) =>
			Promise.resolve(buildResponse(page)),
		);

		renderPage();
		await screen.findByText("Cliente 1");

		// próxima chamada (com filtro) fica pendente
		let resolveFiltered!: (r: PaginatedResponse<Appointment>) => void;
		mockListAppointments.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveFiltered = resolve;
				}),
		);
		await user.selectOptions(screen.getByLabelText("Status"), "AGENDADO");

		await vi.waitFor(() => {
			expect(
				document.querySelectorAll('[data-slot="skeleton"]').length,
			).toBeGreaterThan(0);
		});

		resolveFiltered(buildResponse(1));
		expect(await screen.findByText("Cliente 1")).toBeInTheDocument();
	});
});

describe("AgendamentosPage — estado vazio", () => {
	const emptyResponse: PaginatedResponse<Appointment> = {
		items: [],
		page: 1,
		size: 5,
		total: 0,
		totalPages: 0,
	};

	beforeEach(() => {
		mockFilterOptions();
		mockListAppointments.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("exibe mensagem de vazio sem botão Limpar filtros quando não há filtros ativos", async () => {
		mockListAppointments.mockResolvedValue(emptyResponse);

		renderPage();

		expect(await screen.findByText("Nenhum agendamento")).toBeInTheDocument();
		expect(
			screen.getByText("Ainda não há agendamentos cadastrados."),
		).toBeInTheDocument();
		expect(screen.queryByRole("table")).toBeNull();
		expect(
			screen.queryByRole("button", {
				name: /Limpar filtros/i,
			}),
		).toBeNull();
		expect(screen.getByText("0 resultados")).toBeInTheDocument();
	});

	it("exibe vazio com botão Limpar filtros e restaura listagem ao clicar", async () => {
		const user = userEvent.setup();
		// com filtro status=AGENDADO → vazio; sem filtro → buildResponse(1)
		mockListAppointments.mockImplementation(async ({ filters }) =>
			filters && filters.status === "AGENDADO"
				? Promise.resolve(emptyResponse)
				: Promise.resolve(buildResponse(1)),
		);

		renderPage();
		await screen.findByText("Cliente 1");

		await user.selectOptions(screen.getByLabelText("Status"), "AGENDADO");

		// estado vazio com ação de limpar
		expect(
			await screen.findByText("Nenhum agendamento encontrado"),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Revise os filtros ou limpe a busca para voltar à listagem completa.",
			),
		).toBeInTheDocument();
		const limparBtn = screen.getByRole("button", {
			name: /Limpar filtros/i,
		});
		expect(limparBtn).toBeInTheDocument();
		expect(limparBtn).toHaveAttribute("type", "button");

		// clica em Limpar filtros → restaura a listagem
		await user.click(limparBtn);
		expect(await screen.findByText("Cliente 1")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", {
				name: /Limpar filtros/i,
			}),
		).toBeNull();
	});
});

describe("AgendamentosPage — cancelamento (FE3)", () => {
	beforeEach(() => {
		mockFilterOptions();
		mockListAppointments.mockReset();
		mockListAppointments.mockImplementation(async ({ page }) =>
			Promise.resolve(buildResponse(page)),
		);
		mockCancelarAgendamento.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("fluxo CLIENTE: abre modal, seleciona origem, confirma → fecha modal, toast, lista atualizada", async () => {
		const user = userEvent.setup();
		mockCancelarAgendamento.mockResolvedValue({
			id: "p1-1",
			status: "CANCELADO",
			cancelado_por: "CLIENTE",
			cancelado_em: new Date().toISOString(),
			observacao_cancelamento: null,
		});

		renderPage();
		await screen.findByText("Cliente 1");

		const cancelarBtn = botaoCancelarDe("Cliente 1");
		await user.click(cancelarBtn);

		await user.click(screen.getByLabelText("Solicitação do cliente"));
		await user.click(
			screen.getByRole("button", { name: "Confirmar cancelamento" }),
		);

		await screen.findByText("Agendamento cancelado");
		expect(mockCancelarAgendamento).toHaveBeenCalledWith("p1-1", {
			origem: "CLIENTE",
			observacao: undefined,
		});
	});

	it("fluxo MEDICO: abre modal, seleciona origem, confirma → fecha modal, toast com msg correta", async () => {
		const user = userEvent.setup();
		mockCancelarAgendamento.mockResolvedValue({
			id: "p1-1",
			status: "CANCELADO",
			cancelado_por: "MEDICO",
			cancelado_em: new Date().toISOString(),
			observacao_cancelamento: null,
		});

		renderPage();
		await screen.findByText("Cliente 1");

		const cancelarBtn = botaoCancelarDe("Cliente 1");
		await user.click(cancelarBtn);

		await user.click(screen.getByLabelText("Indisponibilidade do médico"));
		await user.click(
			screen.getByRole("button", { name: "Confirmar cancelamento" }),
		);

		await screen.findByText("Agendamento cancelado");
		await screen.findByText(
			"O horário foi desativado por indisponibilidade do médico.",
		);
		expect(mockCancelarAgendamento).toHaveBeenCalledWith("p1-1", {
			origem: "MEDICO",
			observacao: undefined,
		});
	});

	it("erro mantém modal aberto, preserva origem/observação, exibe mensagem", async () => {
		const user = userEvent.setup();
		mockCancelarAgendamento.mockRejectedValue(new Error("Erro de rede"));

		renderPage();
		await screen.findByText("Cliente 1");

		const cancelarBtn = botaoCancelarDe("Cliente 1");
		await user.click(cancelarBtn);

		await user.click(screen.getByLabelText("Solicitação do cliente"));
		await user.type(
			screen.getByLabelText("Observação opcional"),
			"Motivo do cancelamento",
		);
		await user.click(
			screen.getByRole("button", { name: "Confirmar cancelamento" }),
		);

		await screen.findByText("Erro de rede");
		expect(screen.getByLabelText("Solicitação do cliente")).toBeChecked();
		expect(screen.getByLabelText("Observação opcional")).toHaveValue(
			"Motivo do cancelamento",
		);
		expect(mockCancelarAgendamento).toHaveBeenCalledTimes(1);
	});

	it("múltiplos cliques em Confirmar não disparam múltiplas submissões", async () => {
		const user = userEvent.setup();
		mockCancelarAgendamento.mockResolvedValue({
			id: "p1-1",
			status: "CANCELADO",
			cancelado_por: "CLIENTE",
			cancelado_em: new Date().toISOString(),
			observacao_cancelamento: null,
		});

		renderPage();
		await screen.findByText("Cliente 1");

		const cancelarBtn = botaoCancelarDe("Cliente 1");
		await user.click(cancelarBtn);

		await user.click(screen.getByLabelText("Solicitação do cliente"));
		const confirmar = screen.getByRole("button", {
			name: "Confirmar cancelamento",
		});
		await user.click(confirmar);
		await user.click(confirmar);
		await user.click(confirmar);

		await screen.findByText("Agendamento cancelado");
		expect(mockCancelarAgendamento).toHaveBeenCalledTimes(1);
	});
});
