import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HorarioDisponivelResponse } from "@/api/generated";
import * as schedulesHook from "../../hooks/useAvailableSchedules";
import { HorariosPage } from "../HorariosPage";

vi.mock("../../hooks/useAvailableSchedules", () => ({
	useAvailableSchedules: vi.fn(),
}));

const schedule: HorarioDisponivelResponse = {
	id: "22222222-2222-4222-8222-222222222222",
	inicio: "2026-09-01T08:00:00Z",
	fim: "2026-09-01T09:00:00Z",
	medico: {
		id: "11111111-1111-4111-8111-111111111111",
		nome: "Dra. Mariana Alves",
	},
};

function renderPage() {
	return render(
		<MemoryRouter initialEntries={["/horarios"]}>
			<Routes>
				<Route path="/horarios" element={<HorariosPage />} />
				<Route path="/horarios/novo" element={<p>Cadastro de horários</p>} />
			</Routes>
		</MemoryRouter>,
	);
}

function mockState(
	override: Partial<
		ReturnType<typeof schedulesHook.useAvailableSchedules>
	> = {},
) {
	return {
		schedules: [],
		doctors: [
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
		],
		specialties: [
			{
				id: "33333333-3333-4333-8333-333333333333",
				nome: "Cardiologia",
			},
		],
		loading: false,
		error: null,
		refresh: vi.fn(),
		...override,
	};
}

describe("HorariosPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(schedulesHook.useAvailableSchedules).mockReturnValue(mockState());
	});

	it("exibe filtros, resultado retornado e acesso ao cadastro", () => {
		vi.mocked(schedulesHook.useAvailableSchedules).mockReturnValue(
			mockState({ schedules: [schedule] }),
		);

		renderPage();

		expect(screen.getByLabelText("Data")).toBeInTheDocument();
		expect(screen.getByLabelText("Médico")).toBeInTheDocument();
		expect(screen.getByLabelText("Especialidade")).toBeInTheDocument();
		expect(screen.getAllByText("Dra. Mariana Alves")).toHaveLength(2);
		expect(
			screen.getByRole("link", { name: "Cadastrar horários" }),
		).toHaveAttribute("href", "/horarios/novo");
	});

	it("exibe carregamento enquanto consulta a disponibilidade", () => {
		vi.mocked(schedulesHook.useAvailableSchedules).mockReturnValue(
			mockState({ loading: true }),
		);
		renderPage();

		expect(screen.getByText("Carregando horários...")).toBeInTheDocument();
		expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
	});

	it("atualiza os filtros e permite limpá-los", async () => {
		const user = userEvent.setup();
		renderPage();

		await user.selectOptions(
			screen.getByLabelText("Especialidade"),
			"33333333-3333-4333-8333-333333333333",
		);
		const latestCall = vi
			.mocked(schedulesHook.useAvailableSchedules)
			.mock.calls.at(-1);
		expect(latestCall?.[0]).toEqual({
			especialidadeId: "33333333-3333-4333-8333-333333333333",
		});

		await user.click(screen.getByRole("button", { name: "Limpar" }));
		const clearedCall = vi
			.mocked(schedulesHook.useAvailableSchedules)
			.mock.calls.at(-1);
		expect(clearedCall?.[0]).toEqual({});
	});

	it("exibe estado vazio sem filtros ativos", () => {
		vi.mocked(schedulesHook.useAvailableSchedules).mockReturnValue(
			mockState({
				error: null,
				schedules: [],
			}),
		);
		renderPage();

		expect(
			screen.getByText("Ainda não há horários disponíveis"),
		).toBeInTheDocument();
	});

	it("exibe orientação e ação de limpeza quando o filtro não encontra horários", async () => {
		const user = userEvent.setup();
		renderPage();

		await user.selectOptions(
			screen.getByLabelText("Especialidade"),
			"33333333-3333-4333-8333-333333333333",
		);

		expect(screen.getByText("Nenhum horário encontrado")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Limpar filtros" }),
		).toBeInTheDocument();
	});

	it("exibe erro e permite tentar novamente", async () => {
		const user = userEvent.setup();
		const refresh = vi.fn();
		vi.mocked(schedulesHook.useAvailableSchedules).mockReturnValue(
			mockState({ error: "Falha de comunicação", refresh }),
		);
		renderPage();

		expect(screen.getByText("Falha de comunicação")).toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: /Tentar novamente/ }));
		expect(refresh).toHaveBeenCalledTimes(1);
	});
});
