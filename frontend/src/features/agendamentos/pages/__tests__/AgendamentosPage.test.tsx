import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Appointment, PaginatedResponse } from "../../api/types";
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
	listAppointments: (params: { page: number; size: number }) =>
		mockListAppointments(params),
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
		expect(mockListAppointments).toHaveBeenCalledWith({ page: 1, size: 5 });
	});

	it("ao clicar na página 2, busca novos registros e atualiza a contagem", async () => {
		const user = userEvent.setup();
		render(<AgendamentosPage />);

		await screen.findByText("Cliente 1");
		mockListAppointments.mockClear();

		await user.click(screen.getByRole("button", { name: "Página 2" }));

		expect(await screen.findByText("Cliente 6")).toBeInTheDocument();
		expect(mockListAppointments).toHaveBeenCalledWith({ page: 2, size: 5 });

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
