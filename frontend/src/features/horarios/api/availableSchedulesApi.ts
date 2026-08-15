import { ApiError, api } from "@/api/api";
import {
	EspecialidadePage,
	type HorarioCreate,
	HorarioDisponivelResponse,
	type HorarioDisponivelResponse as HorarioDisponivelResponseType,
	type HorarioLoteCreate,
	HorarioResponse,
	HorariosLoteResponse,
	MedicoPage,
} from "@/api/generated";

export type AvailableScheduleFilters = {
	data?: string;
	medicoId?: string;
	especialidadeId?: string;
};

function buildQueryString(filters: AvailableScheduleFilters): string {
	const params = new URLSearchParams();

	if (filters.data) params.set("data", filters.data);
	if (filters.medicoId) params.set("medico_id", filters.medicoId);
	if (filters.especialidadeId) {
		params.set("especialidade_id", filters.especialidadeId);
	}

	const query = params.toString();
	return query ? `?${query}` : "";
}

export async function listAvailableSchedules(
	filters: AvailableScheduleFilters = {},
): Promise<HorarioDisponivelResponseType[]> {
	const payload = await api.get(
		`/horarios/disponiveis${buildQueryString(filters)}`,
	);

	return HorarioDisponivelResponse.array().parse(payload);
}

export async function listDoctors() {
	const payload = await api.get("/medicos?limite=100");
	return MedicoPage.parse(payload).items;
}

export async function listSpecialties() {
	const payload = await api.get("/especialidades?limite=100");
	return EspecialidadePage.parse(payload).items;
}

export async function createSchedule(payload: HorarioCreate) {
	const response = await api.post("/horarios", payload);
	return HorarioResponse.parse(response);
}

export async function createSchedulesBatch(payload: HorarioLoteCreate) {
	const response = await api.post("/horarios/lote", payload);
	return HorariosLoteResponse.parse(response);
}

export function getScheduleErrorMessage(
	error: unknown,
	fallback: string,
): string {
	if (!(error instanceof ApiError)) {
		return error instanceof Error ? error.message : fallback;
	}

	try {
		const body: unknown = JSON.parse(error.message);
		if (typeof body !== "object" || body === null || !("detail" in body)) {
			return fallback;
		}
		const detail = body.detail;
		if (typeof detail === "string") return detail;
		if (Array.isArray(detail)) {
			const messages = detail.flatMap((item) => {
				if (typeof item === "object" && item !== null && "msg" in item) {
					return typeof item.msg === "string" ? [item.msg] : [];
				}
				return [];
			});
			if (messages.length > 0) return messages.join(" ");
		}
	} catch {
		return fallback;
	}

	return fallback;
}
