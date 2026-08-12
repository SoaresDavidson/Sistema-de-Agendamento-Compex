import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	Appointment,
	AppointmentFilters,
	PaginatedResponse,
} from "../../api/types";
import { AgendamentosPage } from "../AgendamentosPage";

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

const mockListAppointments = vi.fn();

vi.mock("../../api/appointmentsApi", () => ({
	listAppointments: (params: {
		page: number;
		size: number;
		filters?: AppointmentFilters;
	}) => mockListAppointments(params),
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

describe("AgendamentosPage — integração de paginação", () => {
	beforeEach(() => {
		mockListAppointments.mockReset();
		mockListAppointments.mockImplementation(async ({ page }) =>
			Promise.resolve(buildResponse(page)),
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("renderiza a primeira página com 5 registros", async () => {
		render(<AgendamentosPage />);
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
		render(<AgendamentosPage />);

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
		render(<AgendamentosPage />);
		await screen.findByText("Cliente 1");
		expect(
			screen.getByRole("button", { name: "Página anterior" }),
		).toBeDisabled();
	});
});

describe("AgendamentosPage — filtros da listagem", () => {
	beforeEach(() => {
		mockListAppointments.mockReset();
		mockListAppointments.mockImplementation(async ({ page }) =>
			Promise.resolve(buildResponse(page)),
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("renderiza o toolbar de filtros com os 6 campos acima da tabela", async () => {
		render(<AgendamentosPage />);
		await screen.findByText("Cliente 1");
		expect(screen.getByLabelText("Buscar cliente")).toBeInTheDocument();
		expect(screen.getByLabelText("Médico")).toBeInTheDocument();
		expect(screen.getByLabelText("Especialidade")).toBeInTheDocument();
		expect(screen.getByLabelText("Status")).toBeInTheDocument();
		expect(screen.getByLabelText("Data")).toBeInTheDocument();
	});

	it("alterar o select de Status dispara chamada com filtro e volta para página 1", async () => {
		const user = userEvent.setup();
		render(<AgendamentosPage />);
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
		render(<AgendamentosPage />);
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
		render(<AgendamentosPage />);
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
		render(<AgendamentosPage />);
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

		render(<AgendamentosPage />);

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

		render(<AgendamentosPage />);
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

		render(<AgendamentosPage />);
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
		mockListAppointments.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("exibe mensagem de vazio sem botão Limpar filtros quando não há filtros ativos", async () => {
		mockListAppointments.mockResolvedValue(emptyResponse);

		render(<AgendamentosPage />);

		expect(await screen.findByText("Nenhum agendamento")).toBeInTheDocument();
		expect(
			screen.getByText("Ainda não há agendamentos cadastrados."),
		).toBeInTheDocument();
		expect(screen.queryByRole("table")).toBeNull();
		expect(
			screen.queryByRole("button", { name: /Limpar filtros/i }),
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

		render(<AgendamentosPage />);
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
		const limparBtn = screen.getByRole("button", { name: /Limpar filtros/i });
		expect(limparBtn).toBeInTheDocument();
		expect(limparBtn).toHaveAttribute("type", "button");

		// clica em Limpar filtros → restaura a listagem
		await user.click(limparBtn);
		expect(await screen.findByText("Cliente 1")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /Limpar filtros/i }),
		).toBeNull();
	});
});
