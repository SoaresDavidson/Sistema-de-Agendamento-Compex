import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/api";
import { ClientCadastro } from "@/features/clientes/components/ClientCadastro";
import { clienteService } from "@/features/clientes/services/clientes.service";
import type {
	ClienteCreate,
	ClienteResponse,
} from "@/features/clientes/types/cliente.types";

vi.mock("@/features/clientes/services/clientes.service", () => ({
	clienteService: { createClient: vi.fn(), updateClient: vi.fn() },
}));

const createClientMock = vi.mocked(clienteService.createClient);
const updateClientMock = vi.mocked(clienteService.updateClient);
const brazilianBirthDate = "20/05/1990";
const cliente: ClienteResponse = {
	id: "8ee41072-9f17-49b0-b20b-e4e84990c26b",
	nome: "Ana Ribeiro",
	telefone: "(85) 98841-2030",
	email: null,
	data_nascimento: "1990-05-20",
};

function renderCadastro() {
	return render(
		<MemoryRouter initialEntries={["/clientes/cadastro"]}>
			<Routes>
				<Route path="/clientes/cadastro" element={<ClientCadastro />} />
				<Route path="/clientes" element={<h1>Lista de clientes</h1>} />
			</Routes>
		</MemoryRouter>,
	);
}

function renderEdicao() {
	return render(
		<MemoryRouter
			initialEntries={[
				{
					pathname: `/clientes/${cliente.id}/editar`,
					state: { cliente },
				},
			]}
		>
			<Routes>
				<Route path="/clientes/:id/editar" element={<ClientCadastro />} />
				<Route path="/clientes" element={<h1>Lista de clientes</h1>} />
			</Routes>
		</MemoryRouter>,
	);
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
	await user.type(
		screen.getByRole("textbox", { name: /Nome completo/ }),
		cliente.nome,
	);
	await user.type(
		screen.getByRole("textbox", { name: /Telefone/ }),
		cliente.telefone,
	);
	await user.type(
		screen.getByLabelText(/Data de nascimento/),
		brazilianBirthDate,
	);
}

describe("ClientCadastro", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		createClientMock.mockResolvedValue(cliente);
		updateClientMock.mockResolvedValue(cliente);
	});

	it("renderiza campos acessíveis e identifica obrigatoriedade", () => {
		renderCadastro();
		expect(
			screen.getByRole("heading", { name: "Cadastrar cliente" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("textbox", { name: /Nome completo/ }),
		).toBeRequired();
		expect(screen.getByRole("textbox", { name: /Telefone/ })).toBeRequired();
		expect(
			screen.getByRole("textbox", { name: "E-mail opcional" }),
		).not.toBeRequired();
		const birthDate = screen.getByLabelText(/Data de nascimento/);
		expect(birthDate).toBeRequired();
		expect(birthDate).toHaveAttribute("placeholder", "DD/MM/AAAA");
		expect(birthDate).toHaveAttribute("inputmode", "numeric");
		expect(birthDate).toHaveAttribute("maxlength", "10");
		expect(
			screen.getByRole("button", { name: "Salvar cliente" }),
		).toHaveAttribute("type", "submit");
	});

	it("converte data ISO para formato brasileiro ao editar", () => {
		renderEdicao();

		expect(
			screen.getByRole("heading", { name: "Editar cliente" }),
		).toBeInTheDocument();
		expect(screen.getByLabelText(/Data de nascimento/)).toHaveValue(
			brazilianBirthDate,
		);
		expect(updateClientMock).not.toHaveBeenCalled();
	});

	it("valida nome, telefone e data vazios, foca primeiro campo e não envia", async () => {
		const user = userEvent.setup();
		renderCadastro();
		await user.click(screen.getByRole("button", { name: "Salvar cliente" }));
		expect(screen.getByText("Informe nome completo.")).toBeInTheDocument();
		expect(screen.getByText("Informe telefone.")).toBeInTheDocument();
		expect(screen.getByText("Informe data de nascimento.")).toBeInTheDocument();
		expect(screen.getByLabelText(/Data de nascimento/)).toHaveAttribute(
			"aria-invalid",
			"true",
		);
		expect(
			screen.getByLabelText(/Data de nascimento/),
		).toHaveAccessibleDescription("Informe data de nascimento.");
		expect(
			screen.getByRole("textbox", { name: /Nome completo/ }),
		).toHaveFocus();
		expect(createClientMock).not.toHaveBeenCalled();
	});

	it("rejeita e-mail a@b.c no campo sem chamar API", async () => {
		const user = userEvent.setup();
		renderCadastro();
		await fillRequiredFields(user);
		await user.type(
			screen.getByRole("textbox", { name: "E-mail opcional" }),
			"a@b.c",
		);
		await user.click(screen.getByRole("button", { name: "Salvar cliente" }));
		expect(screen.getByText("Informe e-mail válido.")).toBeInTheDocument();
		expect(
			screen.getByRole("textbox", { name: "E-mail opcional" }),
		).toHaveAttribute("aria-invalid", "true");
		expect(createClientMock).not.toHaveBeenCalled();
	});

	it.each([
		["formato incompleto", "20/05/199", "Informe data de nascimento válida."],
		["dia impossível", "31/02/1990", "Informe data de nascimento válida."],
		["ano não bissexto", "29/02/1900", "Informe data de nascimento válida."],
		[
			"data futura",
			"01/01/2999",
			"Data de nascimento não pode estar no futuro.",
		],
	])("rejeita %s no campo e não chama API", async (_scenario, value, error) => {
		const user = userEvent.setup();
		renderCadastro();
		await user.type(
			screen.getByRole("textbox", { name: /Nome completo/ }),
			cliente.nome,
		);
		await user.type(
			screen.getByRole("textbox", { name: /Telefone/ }),
			cliente.telefone,
		);
		const birthDate = screen.getByLabelText(/Data de nascimento/);
		fireEvent.change(birthDate, {
			target: { value },
		});
		await user.click(screen.getByRole("button", { name: "Salvar cliente" }));
		expect(screen.getByText(error)).toBeInTheDocument();
		expect(birthDate).toHaveAttribute("aria-invalid", "true");
		expect(birthDate).toHaveAccessibleDescription(error);
		expect(birthDate).toHaveFocus();
		expect(createClientMock).not.toHaveBeenCalled();
	});

	it("aceita como limite a data de datetime.now(UTC).date() perto da virada", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-08-15T00:30:00.000Z"));
		vi.spyOn(Date.prototype, "getFullYear").mockReturnValue(2026);
		vi.spyOn(Date.prototype, "getMonth").mockReturnValue(7);
		vi.spyOn(Date.prototype, "getDate").mockReturnValue(14);
		createClientMock.mockReturnValue(new Promise(() => {}));

		try {
			const now = new Date();
			expect(now.getDate()).toBe(14);
			expect(now.toISOString().slice(0, 10)).toBe("2026-08-15");

			renderCadastro();
			fireEvent.change(screen.getByRole("textbox", { name: /Nome completo/ }), {
				target: { value: cliente.nome },
			});
			fireEvent.change(screen.getByRole("textbox", { name: /Telefone/ }), {
				target: { value: cliente.telefone },
			});
			fireEvent.change(screen.getByLabelText(/Data de nascimento/), {
				target: { value: "15/08/2026" },
			});
			fireEvent.click(screen.getByRole("button", { name: "Salvar cliente" }));

			expect(createClientMock).toHaveBeenCalledWith(
				expect.objectContaining({ data_nascimento: "2026-08-15" }),
			);
			expect(
				screen.queryByText("Data de nascimento não pode estar no futuro."),
			).not.toBeInTheDocument();
		} finally {
			vi.restoreAllMocks();
			vi.useRealTimers();
		}
	});

	it("aceita 29/02 em ano bissexto e envia data ISO", async () => {
		const user = userEvent.setup();
		renderCadastro();
		await user.type(
			screen.getByRole("textbox", { name: /Nome completo/ }),
			cliente.nome,
		);
		await user.type(
			screen.getByRole("textbox", { name: /Telefone/ }),
			cliente.telefone,
		);
		await user.type(screen.getByLabelText(/Data de nascimento/), "29/02/2000");

		await user.click(screen.getByRole("button", { name: "Salvar cliente" }));

		await waitFor(() =>
			expect(createClientMock).toHaveBeenCalledWith(
				expect.objectContaining({ data_nascimento: "2000-02-29" }),
			),
		);
	});

	it("converte ano entre 1 e 99 sem deslocá-lo para 1900–1999", async () => {
		const user = userEvent.setup();
		renderCadastro();
		await user.type(
			screen.getByRole("textbox", { name: /Nome completo/ }),
			cliente.nome,
		);
		await user.type(
			screen.getByRole("textbox", { name: /Telefone/ }),
			cliente.telefone,
		);
		await user.type(screen.getByLabelText(/Data de nascimento/), "01/01/0099");

		await user.click(screen.getByRole("button", { name: "Salvar cliente" }));

		await waitFor(() =>
			expect(createClientMock).toHaveBeenCalledWith(
				expect.objectContaining({ data_nascimento: "0099-01-01" }),
			),
		);
	});

	it("mostra erro por campo e não chama API quando nome e telefone excedem 255 caracteres", async () => {
		const user = userEvent.setup();
		renderCadastro();
		const name = screen.getByRole("textbox", { name: /Nome completo/ });
		const phone = screen.getByRole("textbox", { name: /Telefone/ });
		expect(name).toHaveAttribute("maxlength", "255");
		expect(phone).toHaveAttribute("maxlength", "255");
		fireEvent.change(name, { target: { value: "N".repeat(256) } });
		fireEvent.change(phone, { target: { value: "9".repeat(256) } });
		await user.type(
			screen.getByLabelText(/Data de nascimento/),
			brazilianBirthDate,
		);

		await user.click(screen.getByRole("button", { name: "Salvar cliente" }));

		expect(
			screen.getByText("Nome deve ter no máximo 255 caracteres."),
		).toBeInTheDocument();
		expect(
			screen.getByText("Telefone deve ter no máximo 255 caracteres."),
		).toBeInTheDocument();
		expect(name).toHaveAttribute("aria-invalid", "true");
		expect(phone).toHaveAttribute("aria-invalid", "true");
		expect(createClientMock).not.toHaveBeenCalled();
	});

	it("cadastra data brasileira como ISO e envia e-mail vazio como null", async () => {
		const user = userEvent.setup();
		renderCadastro();
		await fillRequiredFields(user);
		await user.click(screen.getByRole("button", { name: "Salvar cliente" }));
		await waitFor(() =>
			expect(createClientMock).toHaveBeenCalledWith({
				nome: cliente.nome,
				telefone: cliente.telefone,
				email: null,
				data_nascimento: "1990-05-20",
				confirmar_duplicidade: false,
			} satisfies ClienteCreate),
		);
	});

	it("mostra loading, desabilita botão e bloqueia submissões simultâneas", async () => {
		let resolveCreate!: (value: ClienteResponse) => void;
		createClientMock.mockReturnValue(
			new Promise((resolve) => {
				resolveCreate = resolve;
			}),
		);
		const user = userEvent.setup();
		const { container } = renderCadastro();
		await fillRequiredFields(user);
		const form = container.querySelector("form");
		if (!form) throw new Error("Formulário não renderizado");
		fireEvent.submit(form);
		fireEvent.submit(form);
		expect(
			await screen.findByRole("button", { name: "Salvando..." }),
		).toBeDisabled();
		const back = screen.getByRole("button", { name: "Voltar para clientes" });
		const cancel = screen.getByRole("button", { name: "Cancelar" });
		expect(back).toBeDisabled();
		expect(cancel).toBeDisabled();
		await user.click(back);
		await user.click(cancel);
		expect(
			screen.getByRole("heading", { name: "Cadastrar cliente" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Lista de clientes" }),
		).not.toBeInTheDocument();
		expect(createClientMock).toHaveBeenCalledTimes(1);
		resolveCreate(cliente);
		expect(
			await screen.findByRole("heading", { name: "Lista de clientes" }),
		).toBeInTheDocument();
	});

	it("bloqueia edição dos campos durante envio e os libera após erro", async () => {
		let rejectCreate!: (reason: Error) => void;
		createClientMock.mockReturnValue(
			new Promise((_resolve, reject) => {
				rejectCreate = reject;
			}),
		);
		const user = userEvent.setup();
		renderCadastro();
		await fillRequiredFields(user);
		const name = screen.getByRole("textbox", { name: /Nome completo/ });
		const phone = screen.getByRole("textbox", { name: /Telefone/ });
		const email = screen.getByRole("textbox", { name: "E-mail opcional" });
		const birthDate = screen.getByLabelText(/Data de nascimento/);

		await user.click(screen.getByRole("button", { name: "Salvar cliente" }));

		expect(
			await screen.findByRole("button", { name: "Salvando..." }),
		).toBeDisabled();
		expect(name).toBeDisabled();
		expect(phone).toBeDisabled();
		expect(email).toBeDisabled();
		expect(birthDate).toBeDisabled();
		await user.type(name, " alterado");
		expect(name).toHaveValue(cliente.nome);

		rejectCreate(new Error("indisponível"));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Não foi possível salvar o cliente",
		);
		expect(name).toBeEnabled();
		expect(phone).toBeEnabled();
		expect(email).toBeEnabled();
		expect(birthDate).toBeEnabled();
		await user.type(name, " Silva");
		expect(name).toHaveValue(`${cliente.nome} Silva`);
	});

	it("em HTTP 409 preserva dados, não cria novamente e exige confirmação", async () => {
		createClientMock.mockRejectedValueOnce(new ApiError(409, "duplicado"));
		const user = userEvent.setup();
		renderCadastro();
		await fillRequiredFields(user);
		await user.click(screen.getByRole("button", { name: "Salvar cliente" }));
		expect(await screen.findByRole("alert")).toHaveAccessibleName(
			"Possível cliente duplicado",
		);
		expect(screen.getByRole("textbox", { name: /Nome completo/ })).toHaveValue(
			cliente.nome,
		);
		expect(screen.getByRole("textbox", { name: /Telefone/ })).toHaveValue(
			cliente.telefone,
		);
		expect(screen.getByLabelText(/Data de nascimento/)).toHaveValue(
			brazilianBirthDate,
		);
		expect(
			screen.getByRole("button", { name: "Salvar cliente" }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Não prosseguir" }),
		).toHaveFocus();
		expect(createClientMock).toHaveBeenCalledTimes(1);
	});

	it("Prosseguir mesmo assim reenvia confirmação explícita", async () => {
		createClientMock
			.mockRejectedValueOnce(new ApiError(409, "duplicado"))
			.mockResolvedValueOnce(cliente);
		const user = userEvent.setup();
		renderCadastro();
		await fillRequiredFields(user);
		await user.click(screen.getByRole("button", { name: "Salvar cliente" }));
		const decline = await screen.findByRole("button", {
			name: "Não prosseguir",
		});
		expect(decline).toHaveFocus();
		await user.keyboard("{Tab}{Enter}");
		await waitFor(() => expect(createClientMock).toHaveBeenCalledTimes(2));
		expect(createClientMock.mock.calls[1]?.[0]).toEqual({
			nome: cliente.nome,
			telefone: cliente.telefone,
			email: null,
			data_nascimento: "1990-05-20",
			confirmar_duplicidade: true,
		} satisfies ClienteCreate);
		expect(
			await screen.findByRole("heading", { name: "Lista de clientes" }),
		).toBeInTheDocument();
	});

	it("erro inesperado preserva dados, mostra erro e não sinaliza sucesso", async () => {
		createClientMock.mockRejectedValueOnce(new Error("indisponível"));
		const user = userEvent.setup();
		renderCadastro();
		await fillRequiredFields(user);
		await user.click(screen.getByRole("button", { name: "Salvar cliente" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Não foi possível salvar o cliente",
		);
		expect(screen.getByRole("textbox", { name: /Nome completo/ })).toHaveValue(
			cliente.nome,
		);
		expect(
			screen.queryByRole("heading", { name: "Lista de clientes" }),
		).not.toBeInTheDocument();
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		expect(createClientMock).toHaveBeenCalledTimes(1);
	});
});
