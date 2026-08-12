import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AppointmentFilters } from "../../api/types";
import { AppointmentsFilters } from "../AppointmentsFilters";

const baseProps = {
	medicos: ["Dra. Mariana Alves", "Dr. Rafael Monteiro"],
	especialidades: ["Cardiologia", "Dermatologia"],
};

describe("AppointmentsFilters", () => {
	it("renderiza os 6 filtros + botão Limpar com labels acessíveis", () => {
		render(
			<AppointmentsFilters
				{...baseProps}
				filters={{}}
				clientSearchValue=""
				onClientSearchChange={vi.fn()}
				onFiltersChange={vi.fn()}
				onClear={vi.fn()}
			/>,
		);
		expect(screen.getByLabelText("Buscar cliente")).toBeInTheDocument();
		expect(screen.getByLabelText("Médico")).toBeInTheDocument();
		expect(screen.getByLabelText("Especialidade")).toBeInTheDocument();
		expect(screen.getByLabelText("Status")).toBeInTheDocument();
		expect(screen.getByLabelText("Data")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Limpar" })).toBeInTheDocument();
	});

	it("digitar no campo de cliente dispara onClientSearchChange a cada tecla", async () => {
		const user = userEvent.setup();
		const onClientSearchChange = vi.fn();
		render(
			<AppointmentsFilters
				{...baseProps}
				filters={{}}
				clientSearchValue=""
				onClientSearchChange={onClientSearchChange}
				onFiltersChange={vi.fn()}
				onClear={vi.fn()}
			/>,
		);
		await user.type(screen.getByLabelText("Buscar cliente"), "Ana");
		expect(onClientSearchChange).toHaveBeenCalledTimes(3);
		expect(onClientSearchChange).toHaveBeenLastCalledWith("a");
	});

	it("selecionar médico, especialidade e status dispara onFiltersChange com os campos atualizados", async () => {
		const user = userEvent.setup();
		const onFiltersChange = vi.fn();
		render(
			<AppointmentsFilters
				{...baseProps}
				filters={{}}
				clientSearchValue=""
				onClientSearchChange={vi.fn()}
				onFiltersChange={onFiltersChange}
				onClear={vi.fn()}
			/>,
		);

		await user.selectOptions(
			screen.getByLabelText("Médico"),
			"Dr. Rafael Monteiro",
		);
		expect(onFiltersChange).toHaveBeenLastCalledWith({
			medico: "Dr. Rafael Monteiro",
		});

		await user.selectOptions(
			screen.getByLabelText("Especialidade"),
			"Dermatologia",
		);
		expect(onFiltersChange).toHaveBeenLastCalledWith({
			especialidade: "Dermatologia",
		});

		await user.selectOptions(screen.getByLabelText("Status"), "AGENDADO");
		expect(onFiltersChange).toHaveBeenLastCalledWith({
			status: "AGENDADO",
		});
	});

	it("alterar Data dispara onFiltersChange com data em ISO", async () => {
		const user = userEvent.setup();
		const onFiltersChange = vi.fn();
		render(
			<AppointmentsFilters
				{...baseProps}
				filters={{}}
				clientSearchValue=""
				onClientSearchChange={vi.fn()}
				onFiltersChange={onFiltersChange}
				onClear={vi.fn()}
			/>,
		);
		await user.type(screen.getByLabelText("Data"), "2026-08-10");
		expect(onFiltersChange).toHaveBeenLastCalledWith({
			data: "2026-08-10",
		});
	});

	it("clicar em Limpar chama onClear e não onFiltersChange", async () => {
		const user = userEvent.setup();
		const onFiltersChange = vi.fn();
		const onClear = vi.fn();
		render(
			<AppointmentsFilters
				{...baseProps}
				filters={{}}
				clientSearchValue=""
				onClientSearchChange={vi.fn()}
				onFiltersChange={onFiltersChange}
				onClear={onClear}
			/>,
		);
		await user.click(screen.getByRole("button", { name: "Limpar" }));
		expect(onClear).toHaveBeenCalledTimes(1);
		expect(onFiltersChange).not.toHaveBeenCalled();
	});

	it("preserva os filtros recebidos ao atualizar apenas um campo (spread)", async () => {
		const user = userEvent.setup();
		const onFiltersChange = vi.fn();
		const initial: AppointmentFilters = {
			medico: "Dra. Mariana Alves",
			status: "AGENDADO",
		};
		render(
			<AppointmentsFilters
				{...baseProps}
				filters={initial}
				clientSearchValue=""
				onClientSearchChange={vi.fn()}
				onFiltersChange={onFiltersChange}
				onClear={vi.fn()}
			/>,
		);
		await user.selectOptions(
			screen.getByLabelText("Especialidade"),
			"Cardiologia",
		);
		expect(onFiltersChange).toHaveBeenLastCalledWith({
			medico: "Dra. Mariana Alves",
			status: "AGENDADO",
			especialidade: "Cardiologia",
		});
	});
});
