import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { especialidadeService } from "../../services/especialidades.service";
import { useListEspecialidade } from "../useListEspecialidade.hook";

vi.mock("../../services/especialidades.service", () => ({
	especialidadeService: {
		listEspecialidades: vi.fn(),
	},
}));

const mockListEspecialidades = vi.mocked(
	especialidadeService.listEspecialidades,
);

type EspecialidadePage = Awaited<
	ReturnType<typeof especialidadeService.listEspecialidades>
>;

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((promiseResolve, promiseReject) => {
		resolve = promiseResolve;
		reject = promiseReject;
	});
	return { promise, resolve, reject };
}

const cardiologia = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	nome: "Cardiologia",
};

const neurologia = {
	id: "27f3ec50-1e1f-4e36-b1c8-fd387f6b33d4",
	nome: "Neurologia",
};

describe("useListEspecialidade", () => {
	beforeEach(() => {
		mockListEspecialidades.mockReset();
	});

	it("carrega os items e mantém loading ativo até a listagem concluir", async () => {
		const listagem = deferred<EspecialidadePage>();
		mockListEspecialidades.mockReturnValue(listagem.promise);
		const { result } = renderHook(() => useListEspecialidade());

		let request!: Promise<void>;
		act(() => {
			request = result.current.fetchEspecialidades();
		});

		expect(result.current.isLoading).toBe(true);
		expect(result.current.especialidades).toEqual([]);
		expect(result.current.error).toBeNull();

		await act(async () => {
			listagem.resolve({
				items: [cardiologia],
				next_cursor: "proxima-pagina",
			});
			await request;
		});

		expect(result.current.especialidades).toEqual([cardiologia]);
		expect(result.current.nextCursor).toBe("proxima-pagina");
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeNull();
		expect(mockListEspecialidades).toHaveBeenCalledWith(null);
	});

	it("carrega próxima página sem perder itens existentes", async () => {
		mockListEspecialidades.mockResolvedValueOnce({
			items: [cardiologia],
			next_cursor: "pagina-2",
		});
		const proximaPagina = deferred<EspecialidadePage>();
		mockListEspecialidades.mockReturnValueOnce(proximaPagina.promise);
		const { result } = renderHook(() => useListEspecialidade());

		await act(async () => {
			await result.current.fetchEspecialidades();
		});

		let request!: Promise<void>;
		act(() => {
			request = result.current.loadMore();
		});

		expect(result.current.isLoading).toBe(true);
		expect(result.current.especialidades).toEqual([cardiologia]);

		await act(async () => {
			proximaPagina.resolve({ items: [neurologia], next_cursor: null });
			await request;
		});

		expect(mockListEspecialidades).toHaveBeenNthCalledWith(2, "pagina-2");
		expect(result.current.especialidades).toEqual([cardiologia, neurologia]);
		expect(result.current.nextCursor).toBeNull();
		expect(result.current.isLoading).toBe(false);
	});

	it("apresenta erro genérico e encerra loading quando a listagem falha", async () => {
		mockListEspecialidades.mockRejectedValue(new Error("detalhe interno"));
		const { result } = renderHook(() => useListEspecialidade());

		await act(async () => {
			await result.current.fetchEspecialidades();
		});

		expect(result.current.especialidades).toEqual([]);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBe(
			"Não foi possível carregar as especialidades.",
		);
	});

	it("preserva itens e nextCursor quando refresh falha", async () => {
		mockListEspecialidades
			.mockResolvedValueOnce({
				items: [cardiologia],
				next_cursor: "pagina-2",
			})
			.mockRejectedValueOnce(new Error("falha no refresh"));
		const { result } = renderHook(() => useListEspecialidade());

		await act(async () => {
			await result.current.fetchEspecialidades();
		});

		await act(async () => {
			await result.current.fetchEspecialidades();
		});

		expect(result.current.especialidades).toEqual([cardiologia]);
		expect(result.current.nextCursor).toBe("pagina-2");
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBe(
			"Não foi possível carregar as especialidades.",
		);
	});

	it("resposta obsoleta não altera estado nem encerra loading da requisição ativa", async () => {
		const antiga = deferred<EspecialidadePage>();
		const ativa = deferred<EspecialidadePage>();
		mockListEspecialidades
			.mockReturnValueOnce(antiga.promise)
			.mockReturnValueOnce(ativa.promise);
		const { result } = renderHook(() => useListEspecialidade());

		let requestAntiga!: Promise<void>;
		let requestAtiva!: Promise<void>;
		act(() => {
			requestAntiga = result.current.fetchEspecialidades();
			requestAtiva = result.current.fetchEspecialidades();
		});

		await act(async () => {
			antiga.resolve({ items: [cardiologia], next_cursor: "obsoleto" });
			await requestAntiga;
		});

		expect(result.current.especialidades).toEqual([]);
		expect(result.current.nextCursor).toBeNull();
		expect(result.current.isLoading).toBe(true);

		await act(async () => {
			ativa.resolve({ items: [neurologia], next_cursor: "ativo" });
			await requestAtiva;
		});

		expect(result.current.especialidades).toEqual([neurologia]);
		expect(result.current.nextCursor).toBe("ativo");
		expect(result.current.isLoading).toBe(false);
	});

	it("conclusão tardia de requisição antiga não sobrescreve resposta ativa", async () => {
		const antiga = deferred<EspecialidadePage>();
		const ativa = deferred<EspecialidadePage>();
		mockListEspecialidades
			.mockReturnValueOnce(antiga.promise)
			.mockReturnValueOnce(ativa.promise);
		const { result } = renderHook(() => useListEspecialidade());

		let requestAntiga!: Promise<void>;
		let requestAtiva!: Promise<void>;
		act(() => {
			requestAntiga = result.current.fetchEspecialidades();
			requestAtiva = result.current.fetchEspecialidades();
		});

		await act(async () => {
			ativa.resolve({ items: [neurologia], next_cursor: "ativo" });
			await requestAtiva;
		});

		expect(result.current.especialidades).toEqual([neurologia]);
		expect(result.current.nextCursor).toBe("ativo");

		await act(async () => {
			antiga.resolve({ items: [cardiologia], next_cursor: "obsoleto" });
			await requestAntiga;
		});

		expect(result.current.especialidades).toEqual([neurologia]);
		expect(result.current.nextCursor).toBe("ativo");
		expect(result.current.isLoading).toBe(false);
	});
});
