import { api } from "@/api/api";
import {
	HorarioDisponivelResponse,
	type HorarioDisponivelResponse as HorarioDisponivelResponseType,
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
