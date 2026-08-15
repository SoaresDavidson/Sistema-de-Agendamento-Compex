import { afterEach, describe, expect, it, vi } from "vitest";
import {
	listAvailableSchedules,
	listDoctors,
	listSpecialties,
} from "../availableSchedulesApi";

const doctorId = "11111111-1111-4111-8111-111111111111";
const scheduleId = "22222222-2222-4222-8222-222222222222";
const specialtyId = "33333333-3333-4333-8333-333333333333";

function mockJson(payload: unknown, status = 200) {
	return vi.fn().mockResolvedValue(
		new Response(JSON.stringify(payload), {
			status,
			headers: { "Content-Type": "application/json" },
		}),
	);
}

describe("availableSchedulesApi", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("consulta horários sem filtros", async () => {
		const fetchMock = mockJson([]);
		vi.stubGlobal("fetch", fetchMock);

		await expect(listAvailableSchedules()).resolves.toEqual([]);
		expect(fetchMock).toHaveBeenCalledWith(
			"http://127.0.0.1:8000/api/horarios/disponiveis",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("mapeia data, médico e especialidade para os parâmetros do backend", async () => {
		const fetchMock = mockJson([]);
		vi.stubGlobal("fetch", fetchMock);

		await listAvailableSchedules({
			data: "2026-09-01",
			medicoId: doctorId,
			especialidadeId: specialtyId,
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`http://127.0.0.1:8000/api/horarios/disponiveis?data=2026-09-01&medico_id=${doctorId}&especialidade_id=${specialtyId}`,
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("valida e retorna os catálogos usados nos filtros", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						items: [
							{
								id: doctorId,
								nome: "Dra. Mariana Alves",
								especialidades: [{ id: specialtyId, nome: "Cardiologia" }],
							},
						],
						next_cursor: null,
					}),
				),
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						items: [{ id: specialtyId, nome: "Cardiologia" }],
						next_cursor: null,
					}),
				),
			);
		vi.stubGlobal("fetch", fetchMock);

		await expect(listDoctors()).resolves.toHaveLength(1);
		await expect(listSpecialties()).resolves.toEqual([
			{ id: specialtyId, nome: "Cardiologia" },
		]);
	});

	it("valida o formato retornado para horários", async () => {
		vi.stubGlobal(
			"fetch",
			mockJson([
				{
					id: scheduleId,
					inicio: "2026-09-01T08:00:00Z",
					fim: "2026-09-01T09:00:00Z",
					medico: { id: doctorId, nome: "Dra. Mariana Alves" },
				},
			]),
		);

		await expect(listAvailableSchedules()).resolves.toMatchObject([
			{ id: scheduleId, medico: { id: doctorId } },
		]);
	});
});
