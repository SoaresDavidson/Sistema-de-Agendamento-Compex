import { ApiError, api } from "@/api/api";
import { AgendamentoCreate, AgendamentoResponse } from "@/api/generated";
import type {
	Appointment,
	AppointmentFilters,
	CancelamentoPayload,
	CancelamentoResponse,
	ListAppointmentsParams,
	PaginatedResponse,
} from "./types";

function buildQueryString(
	page: number,
	size: number,
	filters: AppointmentFilters,
): string {
	const params = new URLSearchParams({
		page: String(page),
		size: String(size),
	});
	if (filters.cliente) params.set("cliente", filters.cliente);
	if (filters.medico) params.set("medico", filters.medico);
	if (filters.especialidade) params.set("especialidade", filters.especialidade);
	if (filters.status) params.set("status", filters.status);
	if (filters.data) params.set("data", filters.data);
	return params.toString();
}

export async function listAppointments({
	page,
	size,
	filters = {},
}: ListAppointmentsParams): Promise<PaginatedResponse<Appointment>> {
	const qs = buildQueryString(page, size, filters);
	const payload = await api.get<PaginatedResponse<Appointment>>(
		`/agendamentos?${qs}`,
	);
	if (
		!Array.isArray(payload?.items) ||
		typeof payload?.page !== "number" ||
		typeof payload?.totalPages !== "number"
	) {
		throw new Error("Resposta inválida do endpoint de agendamentos");
	}
	return payload;
}

export async function cancelarAgendamento(
	id: string,
	payload: CancelamentoPayload,
): Promise<CancelamentoResponse> {
	return await api.patch<CancelamentoResponse>(
		`/agendamentos/${id}/cancelar`,
		payload,
	);
}

export async function criarAgendamento(
	payload: AgendamentoCreate,
): Promise<AgendamentoResponse> {
	const validPayload = AgendamentoCreate.parse(payload);
	const response = await api.post("/agendamentos", validPayload);
	return AgendamentoResponse.parse(response);
}

export function getAgendamentoErrorMessage(
	error: unknown,
	fallback: string,
): string {
	if (!(error instanceof ApiError)) {
		return error instanceof Error ? error.message : fallback;
	}

	try {
		const body: unknown = JSON.parse(error.message);
		if (typeof body !== "object" || body === null || !("detail" in body)) {
			return error.message || fallback;
		}
		const detail = (body as { detail: unknown }).detail;
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
		return error.message || fallback;
	}

	return error.message || fallback;
}
