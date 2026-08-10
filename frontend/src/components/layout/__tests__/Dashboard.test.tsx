import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardLayout } from "../Dashboard";

// Monta o layout em um roteador de memória, iniciando pela rota informada.
function renderDashboard(path = "/agendamentos") {
	// Renderiza a árvore React no DOM virtual usado pelo teste.
	return render(
		// Simula o histórico do navegador sem alterar a URL real.
		<MemoryRouter initialEntries={[path]}>
			{/* Define as rotas disponíveis no cenário de teste. */}
			<Routes>
				{/* Renderiza DashboardLayout como pai das rotas abaixo. */}
				<Route element={<DashboardLayout />}>
					{/* Simula o conteúdo exibido no Outlet de cada rota filha. */}
					<Route
						path="/agendamentos"
						element={<p>Conteúdo de agendamentos</p>}
					/>
					<Route path="/clientes" element={<p>Conteúdo de clientes</p>} />
				</Route>
			</Routes>
		</MemoryRouter>,
	);
}

// Agrupa os casos de teste relacionados ao DashboardLayout.
describe("DashboardLayout", () => {
	// Executa a limpeza após cada caso de teste.
	afterEach(() => {
		// Restaura o relógio real para não interferir nos testes seguintes.
		vi.useRealTimers();
	});

	// Declara um caso que valida a estrutura e o conteúdo inicial do layout.
	it("renderiza sidebar, header e rota filha", () => {
		renderDashboard();

		// Busca a sidebar pelo papel semântico e confirma sua presença no DOM.
		expect(screen.getByRole("complementary")).toBeInTheDocument();

		// Busca o cabeçalho pelo papel semântico e confirma sua presença no DOM.
		expect(screen.getByRole("banner")).toBeInTheDocument();

		// Busca o link pelo nome acessível e confirma sua presença no DOM.
		expect(
			screen.getByRole("link", { name: "Agendamentos" }),
		).toBeInTheDocument();

		// Confirma que o conteúdo da rota filha foi renderizado no Outlet.
		expect(screen.getByText("Conteúdo de agendamentos")).toBeInTheDocument();

		// Confirma que o título esperado do layout está visível.
		expect(screen.getByText("Agendamento clínico")).toBeInTheDocument();
	});

	// Declara um caso que valida o destaque da rota de agendamentos.
	it("marca Agendamentos como ativo", () => {
		renderDashboard("/agendamentos");

		// Obtém os links pelo nome acessível para comparar suas classes CSS.
		const agendamentos = screen.getByRole("link", {
			name: "Agendamentos",
		});

		const clientes = screen.getByRole("link", {
			name: "Clientes",
		});

		// Confirma que somente o link da rota atual recebe o estilo ativo.
		expect(agendamentos).toHaveClass("bg-muted", "text-primary");
		expect(clientes).not.toHaveClass("bg-muted");
	});

	// Declara um caso que valida o destaque da rota de clientes.
	it("marca Clientes como ativo", () => {
		renderDashboard("/clientes");

		// Obtém os links pelo nome acessível para comparar suas classes CSS.
		const agendamentos = screen.getByRole("link", {
			name: "Agendamentos",
		});

		const clientes = screen.getByRole("link", {
			name: "Clientes",
		});

		// Confirma que somente o link da rota atual recebe o estilo ativo.
		expect(clientes).toHaveClass("bg-muted", "text-primary");
		expect(agendamentos).not.toHaveClass("bg-muted");
	});

	// Declara um caso que valida a formatação da data exibida no layout.
	it("exibe data atual formatada", () => {
		// Substitui os temporizadores reais por temporizadores controlados.
		vi.useFakeTimers();

		// Fixa o relógio em 6 de agosto de 2026, às 12h; mês 7 representa agosto.
		vi.setSystemTime(new Date(2026, 7, 6, 12));

		renderDashboard();

		// Confirma que a data fixa foi formatada e exibida como esperado.
		expect(
			screen.getByText("quinta-feira - 06 agosto 2026"),
		).toBeInTheDocument();
	});
});
