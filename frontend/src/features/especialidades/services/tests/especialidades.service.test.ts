import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api/api";
import { especialidadeService } from "../especialidades.service";

vi.mock("@/api/api", () => ({
	api: {
		get: vi.fn(),
		post: vi.fn(),
	},
}));

const especialidade = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	nome: "Cardiologia",
};

const mockedApi = vi.mocked(api);

describe("especialidadeService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("normaliza espaços do nome e envia a criação ao endpoint correto", async () => {
		mockedApi.post.mockResolvedValue(especialidade);

		await expect(
			especialidadeService.createEspecialidade({
				nome: "  Cardiologia   Pediátrica  ",
			}),
		).resolves.toEqual(especialidade);
		expect(mockedApi.post).toHaveBeenCalledWith("/especialidades", {
			nome: "Cardiologia Pediátrica",
		});
	});

	it("rejeita nome composto somente por espaços antes de chamar a API", async () => {
		await expect(
			especialidadeService.createEspecialidade({ nome: "   \t  " }),
		).rejects.toThrow();
		expect(mockedApi.post).not.toHaveBeenCalled();
	});

	it("valida a resposta da criação", async () => {
		mockedApi.post.mockResolvedValue({
			id: "id-invalido",
			nome: "Cardiologia",
		});

		await expect(
			especialidadeService.createEspecialidade({ nome: "Cardiologia" }),
		).rejects.toThrow();
	});

	it("usa limite padrão na listagem e valida a página retornada", async () => {
		const page = { items: [especialidade], next_cursor: null };
		mockedApi.get.mockResolvedValue(page);

		await expect(especialidadeService.listEspecialidades()).resolves.toEqual(
			page,
		);
		expect(mockedApi.get).toHaveBeenCalledWith("/especialidades?limite=20");
	});

	it("envia cursor e limite como query params codificados", async () => {
		mockedApi.get.mockResolvedValue({ items: [], next_cursor: null });

		await especialidadeService.listEspecialidades("cursor com espaços", 50);

		expect(mockedApi.get).toHaveBeenCalledWith(
			"/especialidades?limite=50&cursor=cursor+com+espa%C3%A7os",
		);
	});

	it.each([0, 1.5, 101])(
		"rejeita limite inválido %s antes de chamar a API",
		async (limite) => {
			await expect(
				especialidadeService.listEspecialidades(null, limite),
			).rejects.toThrow();
			expect(mockedApi.get).not.toHaveBeenCalled();
		},
	);

	it.each([1, 100])("aceita limite válido %s", async (limite) => {
		const page = { items: [], next_cursor: null };
		mockedApi.get.mockResolvedValue(page);

		await expect(
			especialidadeService.listEspecialidades(null, limite),
		).resolves.toEqual(page);
		expect(mockedApi.get).toHaveBeenCalledWith(
			`/especialidades?limite=${limite}`,
		);
	});

	it("rejeita item sem id mesmo quando restante da página é válido", async () => {
		mockedApi.get.mockResolvedValue({
			items: [{ nome: "Cardiologia" }],
			next_cursor: "cursor-seguinte",
		});

		await expect(especialidadeService.listEspecialidades()).rejects.toThrow();
	});
});
