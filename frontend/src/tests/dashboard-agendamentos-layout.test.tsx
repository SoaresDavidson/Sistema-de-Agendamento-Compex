import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardLayout } from "../components/layout/Dashboard";
import type {
	Appointment,
	AppointmentFilters,
	PaginatedResponse,
} from "../features/agendamentos/api/types";
import { AgendamentosPage } from "../features/agendamentos/pages/AgendamentosPage";

const appointments: Appointment[] = [
	{
		id: "appointment-1",
		cliente: "Ana Ribeiro",
		medico: "Dra. Mariana Alves",
		especialidade: "Cardiologia",
		data: "10/08/2026",
		horario: "08:00–09:00",
		status: "AGENDADO",
	},
];

const successResponse: PaginatedResponse<Appointment> = {
	items: appointments,
	page: 1,
	size: 5,
	total: 1,
	totalPages: 1,
};

const mockListAppointments = vi.fn();

vi.mock("../features/agendamentos/api/appointmentsApi", () => ({
	listAppointments: (params: {
		page: number;
		size: number;
		filters?: AppointmentFilters;
	}) => mockListAppointments(params),
}));

function renderRoute() {
	return render(
		<MemoryRouter initialEntries={["/agendamentos"]}>
			<Routes>
				<Route element={<DashboardLayout />}>
					<Route path="/agendamentos" element={<AgendamentosPage />} />
					<Route path="*" element={<p>Rota inexistente</p>} />
				</Route>
			</Routes>
		</MemoryRouter>,
	);
}

describe("Dashboard/Agendamentos — contrato do protótipo", () => {
	beforeEach(() => {
		mockListAppointments.mockReset();
		mockListAppointments.mockResolvedValue(successResponse);
	});

	it("usa outlet único e não duplica largura ou padding na página", async () => {
		renderRoute();
		await screen.findByText("Ana Ribeiro");

		const main = screen.getByRole("main");
		expect(main).toHaveClass("outlet");

		const heading = screen.getByRole("heading", {
			level: 1,
			name: "Agendamentos",
		});
		const pageSection = heading.closest("section");
		expect(pageSection).toHaveClass("min-w-0");
		expect(pageSection).not.toHaveClass("max-w-5xl", "px-8", "pt-12");

		const content = screen
			.getByLabelText("Buscar cliente")
			.closest("[aria-busy]");
		expect(content).toHaveClass("min-w-0");
		expect(content).not.toHaveClass("max-w-5xl", "px-8");
	});

	it("mantém cabeçalho semântico com ação para novo agendamento", async () => {
		renderRoute();
		await screen.findByText("Ana Ribeiro");

		const heading = screen.getByRole("heading", {
			level: 1,
			name: "Agendamentos",
		});
		expect(heading.closest("header")).toHaveClass("page-head");
		expect(
			screen.getByText(
				"Consulte atendimentos futuros e históricos. O estado concluído é calculado pelo fim do horário.",
			),
		).toBeInTheDocument();

		const novoAgendamentoLink = screen.getByRole("link", {
			name: "Novo agendamento",
		});
		expect(novoAgendamentoLink).toBeInTheDocument();
		expect(novoAgendamentoLink).toHaveAttribute("href", "/agendamentos/novo");
	});

	it("mantém sidebar fixa na grade sem infraestrutura de drawer", async () => {
		renderRoute();
		await screen.findByText("Ana Ribeiro");

		const sidebar = screen.getByRole("complementary", {
			name: "Navegação principal",
		});
		const main = screen.getByRole("main");
		const workspace = main.parentElement;
		const shell = sidebar.parentElement;

		expect(sidebar).toHaveClass("dashboard-sidebar");
		expect(shell).toHaveClass("app-shell");
		expect(workspace).toHaveClass("workspace");
		expect(shell?.children[0]).toBe(sidebar);
		expect(shell?.children[1]).toBe(workspace);
		expect(workspace).toContainElement(main);
		expect(workspace).not.toHaveAttribute("inert");

		expect(
			screen.queryByRole("button", {
				name: /menu de navegação/i,
			}),
		).not.toBeInTheDocument();
		expect(document.querySelector(".sidebar-backdrop")).toBeNull();
		expect(document.querySelector(".menu-btn")).toBeNull();
		expect(document.querySelector(".sidebar-close")).toBeNull();
		expect(sidebar).not.toHaveClass("is-open");

		const agendamentos = within(sidebar).getByRole("link", {
			name: "Agendamentos",
		});
		const clientes = within(sidebar).getByRole("link", {
			name: "Clientes",
		});
		expect(agendamentos).toHaveClass("sidebar-nav-link");
		expect(clientes).toHaveClass("sidebar-nav-link");
		expect(agendamentos.querySelector("svg")).toHaveAttribute(
			"aria-hidden",
			"true",
		);
		expect(clientes.querySelector("svg")).toHaveAttribute(
			"aria-hidden",
			"true",
		);
	});

	it("preserva filtros, tabela com overflow, paginação e modal", async () => {
		const user = userEvent.setup();
		renderRoute();
		await screen.findByText("Ana Ribeiro");

		expect(screen.getByLabelText("Buscar cliente")).toBeInTheDocument();
		expect(screen.getByLabelText("Médico")).toBeInTheDocument();
		expect(screen.getByLabelText("Especialidade")).toBeInTheDocument();
		expect(screen.getByLabelText("Status")).toBeInTheDocument();
		expect(screen.getByLabelText("Data")).toBeInTheDocument();

		const table = screen.getByRole("table");
		expect(table.parentElement).toHaveClass("table-wrap");
		expect(table).toHaveClass("table");
		expect(screen.getByRole("navigation", { name: "Paginação" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Cancelar" }));
		const dialog = screen.getByRole("dialog", {
			name: "Cancelar agendamento",
		});
		expect(dialog).toHaveAttribute("aria-modal", "true");
		expect(within(dialog).getByText(/Ana Ribeiro/)).toBeInTheDocument();
	});

	it("preserva estados de loading e erro com nova tentativa", async () => {
		let rejectRequest: (reason: Error) => void = () => undefined;
		mockListAppointments.mockImplementation(
			() =>
				new Promise((_, reject) => {
					rejectRequest = reject;
				}),
		);
		renderRoute();

		expect(await screen.findByRole("status")).toBeInTheDocument();
		expect(screen.queryByRole("table")).not.toBeInTheDocument();

		rejectRequest(new Error("API indisponível"));
		expect(await screen.findByText("API indisponível")).toBeInTheDocument();
		expect(
			screen.getByText("Tentar novamente").closest("button"),
		).toHaveAttribute("type", "button");
	});

	it("preserva estado vazio com causa e recuperação por filtros", async () => {
		const emptyResponse: PaginatedResponse<Appointment> = {
			items: [],
			page: 1,
			size: 5,
			total: 0,
			totalPages: 0,
		};
		mockListAppointments.mockImplementation(({ filters }) =>
			Promise.resolve(filters?.status ? emptyResponse : successResponse),
		);
		const user = userEvent.setup();
		renderRoute();
		await screen.findByText("Ana Ribeiro");

		await user.selectOptions(screen.getByLabelText("Status"), "AGENDADO");

		expect(
			await screen.findByText("Nenhum agendamento encontrado"),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Revise os filtros ou limpe a busca para voltar à listagem completa.",
			),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: "Limpar filtros",
			}),
		).toBeEnabled();
	});
});
