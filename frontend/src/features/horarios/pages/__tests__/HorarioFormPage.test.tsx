import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as schedulesApi from "../../api/availableSchedulesApi";
import { HorarioFormPage } from "../HorarioFormPage";

vi.mock("../../api/availableSchedulesApi", () => ({
	listDoctors: vi.fn(),
	createSchedule: vi.fn(),
	createSchedulesBatch: vi.fn(),
	getScheduleErrorMessage: vi.fn((_, fallback) => fallback),
}));

const mockDoctors = [
	{
		id: "doc-1",
		nome: "Dr. Roberto Silva",
		crm: "12345-SP",
		email: "roberto@example.com",
		especialidades: [{ id: "esp-1", nome: "Cardiologia" }],
	},
	{
		id: "doc-2",
		nome: "Dra. Ana Santos",
		crm: "67890-SP",
		email: "ana@example.com",
		especialidades: [{ id: "esp-2", nome: "Dermatologia" }],
	},
];

function renderComponent() {
	return render(
		<MemoryRouter initialEntries={["/horarios/novo"]}>
			<Routes>
				<Route path="/horarios/novo" element={<HorarioFormPage />} />
				<Route path="/horarios" element={<div>Lista de Horários</div>} />
			</Routes>
		</MemoryRouter>,
	);
}

describe("HorarioFormPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(schedulesApi.listDoctors).mockResolvedValue(mockDoctors as never);
	});

	it("renders the individual form by default and loads doctors", async () => {
		renderComponent();

		expect(screen.getByRole("status")).toHaveTextContent("Carregando médicos...");

		await waitFor(() => {
			expect(screen.getByLabelText(/Médico/i)).toBeInTheDocument();
		});

		expect(screen.getByLabelText(/Data/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Hora de início/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Hora de fim/i)).toBeInTheDocument();
		expect(
			screen.getByLabelText("Marcar vários horários de uma vez?"),
		).not.toBeChecked();
	});

	it("switches to batch mode when compact checkbox is clicked", async () => {
		const user = userEvent.setup();
		renderComponent();

		await waitFor(() => {
			expect(screen.getByLabelText(/Médico/i)).toBeInTheDocument();
		});

		const checkbox = screen.getByLabelText("Marcar vários horários de uma vez?");
		await user.click(checkbox);

		expect(checkbox).toBeChecked();
		expect(screen.getByLabelText(/Data inicial/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Data final/i)).toBeInTheDocument();
		expect(screen.getByText("Dias da semana")).toBeInTheDocument();
		expect(screen.getByText("Períodos de atendimento")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "+ Adicionar período" }),
		).toBeInTheDocument();
	});

	it("allows adding and removing multiple periods in batch mode", async () => {
		const user = userEvent.setup();
		renderComponent();

		await waitFor(() => {
			expect(screen.getByLabelText(/Médico/i)).toBeInTheDocument();
		});

		await user.click(
			screen.getByLabelText("Marcar vários horários de uma vez?"),
		);

		const addPeriodBtn = screen.getByRole("button", {
			name: "+ Adicionar período",
		});

		// Initially 1 period row, remove button is disabled
		expect(screen.getByRole("button", { name: /Remover período 1/i })).toBeDisabled();

		// Add second period
		await user.click(addPeriodBtn);

		const removeButtons = screen.getAllByRole("button", {
			name: /Remover período/i,
		});
		expect(removeButtons).toHaveLength(2);
		expect(removeButtons[0]).toBeEnabled();
		expect(removeButtons[1]).toBeEnabled();

		// Remove second period
		await user.click(removeButtons[1]);
		expect(screen.getAllByRole("button", { name: /Remover período/i })).toHaveLength(1);
	});

	it("validates and submits batch schedule with custom duration per period, then navigates to /horarios", async () => {
		const user = userEvent.setup();
		vi.mocked(schedulesApi.createSchedulesBatch).mockResolvedValue({
			total_criados: 8,
		} as never);

		renderComponent();

		await waitFor(() => {
			expect(screen.getByLabelText(/Médico/i)).toBeInTheDocument();
		});

		// Select doctor in individual mode first to verify state sync
		await user.selectOptions(screen.getByLabelText(/Médico/i), "doc-1");

		// Toggle to batch mode
		await user.click(
			screen.getByLabelText("Marcar vários horários de uma vez?"),
		);

		// Doctor should be synced
		expect(screen.getByLabelText(/Médico/i)).toHaveValue("doc-1");

		// Fill date range
		await user.type(screen.getByLabelText(/Data inicial/i), "2026-09-01");
		await user.type(screen.getByLabelText(/Data final/i), "2026-09-01");

		// Select weekday (Tuesday)
		await user.click(screen.getByLabelText("Terça"));

		// Fill period 1: 08:00 to 12:00 with 30 min duration
		await user.type(screen.getByLabelText("Início"), "08:00");
		await user.type(screen.getByLabelText("Fim"), "12:00");
		const durationInput = screen.getByLabelText("Duração (min)");
		await user.clear(durationInput);
		await user.type(durationInput, "30");

		// Click Gerar prévia
		await user.click(screen.getByRole("button", { name: "Gerar prévia" }));

		await waitFor(() => {
			expect(screen.getByText(/8 blocos na prévia/i)).toBeInTheDocument();
		});

		// Click Criar horários
		await user.click(
			screen.getByRole("button", { name: /Criar 8 horários/i }),
		);

		await waitFor(() => {
			expect(schedulesApi.createSchedulesBatch).toHaveBeenCalledTimes(1);
			expect(schedulesApi.createSchedulesBatch).toHaveBeenCalledWith({
				medico_id: "doc-1",
				data_inicio: "2026-09-01",
				data_fim: "2026-09-01",
				dias_semana: ["TERCA"],
				inicio_periodo: "08:00",
				fim_periodo: "12:00",
				duracao_minutos: 30,
			});
			expect(screen.getByText("Lista de Horários")).toBeInTheDocument();
		});
	});

	it("submits individual schedule and navigates to /horarios", async () => {
		const user = userEvent.setup();
		vi.mocked(schedulesApi.createSchedule).mockResolvedValue({
			id: "sch-1",
			medico_id: "doc-1",
			inicio: "2026-09-01T08:00:00",
			fim: "2026-09-01T08:30:00",
			ativo: true,
		} as never);

		renderComponent();

		await waitFor(() => {
			expect(screen.getByLabelText(/Médico/i)).toBeInTheDocument();
		});

		await user.selectOptions(screen.getByLabelText(/Médico/i), "doc-1");
		await user.type(screen.getByLabelText(/Data/i), "2026-09-01");
		await user.type(screen.getByLabelText(/Hora de início/i), "08:00");
		await user.type(screen.getByLabelText(/Hora de fim/i), "08:30");

		await user.click(screen.getByRole("button", { name: "Validar e criar" }));

		await waitFor(() => {
			expect(schedulesApi.createSchedule).toHaveBeenCalledTimes(1);
			expect(schedulesApi.createSchedule).toHaveBeenCalledWith({
				medico_id: "doc-1",
				inicio: "2026-09-01T08:00:00",
				fim: "2026-09-01T08:30:00",
			});
			expect(screen.getByText("Lista de Horários")).toBeInTheDocument();
		});
	});
});
