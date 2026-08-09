import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Appointment } from "../../api/types";
import { AppointmentsTable } from "../AppointmentsTable";

const fixtures: Appointment[] = [
	{
		id: "a1",
		cliente: "Ana Paula Ribeiro",
		medico: "Dra. Mariana Alves",
		especialidade: "Cardiologia",
		data: "10/08/2026",
		horario: "08:00–09:00",
		status: "AGENDADO",
	},
	{
		id: "a2",
		cliente: "Elisa Martins Rocha",
		medico: "Dra. Patrícia Gomes",
		especialidade: "Ginecologia",
		data: "05/08/2026",
		horario: "11:00–12:00",
		status: "CONCLUIDO",
	},
	{
		id: "a3",
		cliente: "Gabriela Freitas Melo",
		medico: "Dr. Rafael Monteiro",
		especialidade: "Dermatologia",
		data: "12/08/2026",
		horario: "08:00–09:00",
		status: "CANCELADO",
	},
];

describe("AppointmentsTable", () => {
	it("renderiza as sete colunas na ordem exigida", () => {
		render(<AppointmentsTable appointments={fixtures} />);
		const headers = screen
			.getAllByRole("columnheader")
			.map((h) => h.textContent);
		expect(headers).toEqual([
			"Cliente",
			"Médico",
			"Especialidade",
			"Data",
			"Horário",
			"Status",
			"Ações",
		]);
	});

	it("renderiza uma linha por agendamento com os dados corretos", () => {
		render(<AppointmentsTable appointments={fixtures} />);
		const rows = screen.getAllByRole("row").slice(1);
		expect(rows).toHaveLength(3);

		const first = within(rows[0]);
		expect(first.getByText("Ana Paula Ribeiro")).toBeInTheDocument();
		expect(first.getByText("Dra. Mariana Alves")).toBeInTheDocument();
		expect(first.getByText("Cardiologia")).toBeInTheDocument();
		expect(first.getByText("10/08/2026")).toBeInTheDocument();
		expect(first.getByText("08:00–09:00")).toBeInTheDocument();
		expect(first.getByText("AGENDADO")).toBeInTheDocument();
	});

	it("exibe o botão Cancelar apenas para status AGENDADO", () => {
		render(<AppointmentsTable appointments={fixtures} />);
		const rows = screen.getAllByRole("row").slice(1);

		expect(
			within(rows[0]).getAllByRole("button", { name: "Cancelar" }),
		).toHaveLength(1);
		expect(
			within(rows[1]).queryByRole("button", { name: "Cancelar" }),
		).toBeNull();
		expect(
			within(rows[2]).queryByRole("button", { name: "Cancelar" }),
		).toBeNull();
		expect(
			within(rows[0]).getByRole("button", { name: "Detalhes" }),
		).toBeInTheDocument();
		expect(
			within(rows[1]).getByRole("button", { name: "Detalhes" }),
		).toBeInTheDocument();
		expect(
			within(rows[2]).getByRole("button", { name: "Detalhes" }),
		).toBeInTheDocument();
	});

	it("renderiza apenas Detalhes quando não há AGENDADO", () => {
		const noAgendado: Appointment[] = fixtures.map((a) => ({
			...a,
			status: "CANCELADO" as const,
		}));
		render(<AppointmentsTable appointments={noAgendado} />);
		expect(screen.getAllByRole("button", { name: "Detalhes" })).toHaveLength(3);
		expect(screen.queryByRole("button", { name: "Cancelar" })).toBeNull();
	});
});
