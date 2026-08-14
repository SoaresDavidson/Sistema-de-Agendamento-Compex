import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientesPage } from "@/features/clientes/pages/ClientesPage";
import { clienteService } from "@/features/clientes/services/clientes.service";
import type {
	ClientePage,
	ClienteResponse,
} from "@/features/clientes/types/cliente.types";

vi.mock("@/features/clientes/services/clientes.service", () => ({
	clienteService: { listClients: vi.fn() },
}));

const listClientsMock = vi.mocked(clienteService.listClients);
const cliente: ClienteResponse = {
	id: "8ee41072-9f17-49b0-b20b-e4e84990c26b",
	nome: "Ana Ribeiro",
	telefone: "(85) 98841-2030",
	email: "ana@example.com",
	data_nascimento: "1990-05-20",
};
const page = (items: ClienteResponse[]): ClientePage => ({
	items,
	next_cursor: null,
});

function renderPage(state?: unknown) {
	return render(
		<MemoryRouter initialEntries={[{ pathname: "/clientes", state }]}>
			<Routes>
				<Route path="/clientes" element={<ClientesPage />} />
				<Route path="/clientes/cadastro" element={<h1>Novo cadastro</h1>} />
			</Routes>
		</MemoryRouter>,
	);
}

describe("ClientesPage", () => {
	beforeEach(() => vi.clearAllMocks());

	it("exibe Skeleton durante carregamento e depois lista clientes", async () => {
		let resolveList!: (value: ClientePage) => void;
		listClientsMock.mockReturnValue(
			new Promise((resolve) => {
				resolveList = resolve;
			}),
		);
		renderPage();
		expect(screen.getByRole("table")).toBeInTheDocument();
		expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
			24,
		);
		expect(screen.queryByText(cliente.nome)).not.toBeInTheDocument();
		resolveList(page([cliente]));
		expect(await screen.findByText(cliente.nome)).toBeInTheDocument();
		expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(0);
	});

	it("exibe EmptyState e abre cadastro via teclado", async () => {
		listClientsMock.mockResolvedValue(page([]));
		const user = userEvent.setup();
		renderPage();
		expect(
			await screen.findByText("Nenhum cliente cadastrado"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Cadastre primeiro cliente para começar."),
		).toBeInTheDocument();
		const button = screen.getByRole("button", { name: "Cadastrar cliente" });
		button.focus();
		await user.keyboard("{Enter}");
		expect(
			await screen.findByRole("heading", { name: "Novo cadastro" }),
		).toBeInTheDocument();
	});

	it("exibe ErrorState e refaz busca no retry", async () => {
		listClientsMock
			.mockRejectedValueOnce(new Error("offline"))
			.mockResolvedValueOnce(page([cliente]));
		const user = userEvent.setup();
		renderPage();
		expect(
			await screen.findByRole("heading", { name: "Ops, algo deu errado" }),
		).toBeInTheDocument();
		expect(
			screen.getByText("Não foi possível carregar os clientes."),
		).toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
		expect(await screen.findByText(cliente.nome)).toBeInTheDocument();
		expect(listClientsMock).toHaveBeenCalledTimes(2);
	});

	it("mostra sucesso uma vez, limpa estado de navegação e permite encerrar toast", async () => {
		listClientsMock.mockResolvedValue(page([cliente]));
		const user = userEvent.setup();
		renderPage({ clientSaved: "created" });
		const toast = screen.getByRole("status");
		expect(toast).toHaveTextContent("Cliente cadastrado");
		expect(toast).toHaveTextContent("Os dados foram salvos com sucesso.");
		const close = screen.getByRole("button", { name: "Fechar notificação" });
		close.focus();
		await user.keyboard("{Enter}");
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		await waitFor(() => expect(listClientsMock).toHaveBeenCalledTimes(1));
	});
});
