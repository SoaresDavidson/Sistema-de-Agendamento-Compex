import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type {
	HorarioDisponivelResponse,
	MedicoResponse,
} from "@/api/generated";
import { AvailableSchedulesTable } from "../AvailableSchedulesTable";

const schedule: HorarioDisponivelResponse = {
	id: "22222222-2222-4222-8222-222222222222",
	inicio: "2026-09-10T08:00:00Z",
	fim: "2026-09-10T09:00:00Z",
	medico: {
		id: "11111111-1111-4111-8111-111111111111",
		nome: "Dra. Mariana Alves",
	},
};

const doctors: MedicoResponse[] = [
	{
		id: "11111111-1111-4111-8111-111111111111",
		nome: "Dra. Mariana Alves",
		especialidades: [
			{
				id: "33333333-3333-4333-8333-333333333333",
				nome: "Cardiologia",
			},
		],
	},
];

describe("AvailableSchedulesTable", () => {
	it("oferece atalho para agendar o horário com os dados do bloco", () => {
		render(
			<MemoryRouter>
				<AvailableSchedulesTable schedules={[schedule]} doctors={doctors} />
			</MemoryRouter>,
		);

		const link = screen.getByRole("link", { name: "Marcar horário" });
		const url = new URL(link.getAttribute("href") ?? "", "http://localhost");

		expect(url.pathname).toBe("/agendamentos/novo");
		expect(url.searchParams.get("horario")).toBe(schedule.id);
		expect(url.searchParams.get("especialidade")).toBe(
			doctors[0].especialidades[0].id,
		);
		expect(url.searchParams.get("medico")).toBe(schedule.medico.id);
		expect(url.searchParams.get("data")).toBe("2026-09-10");
		expect(url.searchParams.get("hora")).toBe("08:00–09:00");
	});

	it("exibe botão Desativar quando onDesativar é informado e chama ao clicar", async () => {
		const user = userEvent.setup();
		const onDesativar = vi.fn();
		render(
			<MemoryRouter>
				<AvailableSchedulesTable
					schedules={[schedule]}
					doctors={doctors}
					onDesativar={onDesativar}
				/>
			</MemoryRouter>,
		);

		const btn = screen.getByRole("button", { name: "Desativar" });
		expect(btn).toBeInTheDocument();

		await user.click(btn);
		expect(onDesativar).toHaveBeenCalledWith(schedule);
	});

	it("não exibe botão Desativar quando onDesativar não é informado", () => {
		render(
			<MemoryRouter>
				<AvailableSchedulesTable schedules={[schedule]} doctors={doctors} />
			</MemoryRouter>,
		);

		expect(screen.queryByRole("button", { name: "Desativar" })).not.toBeInTheDocument();
	});
});
