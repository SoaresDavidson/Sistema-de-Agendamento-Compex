import { listMockAppointments } from "./mockAppointments";
import type {
	Appointment,
	AppointmentFilters,
	ListAppointmentsParams,
	PaginatedResponse,
} from "./types";

const API_BASE = "/api";

async function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

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
	try {
		const qs = buildQueryString(page, size, filters);
		const res = await fetch(`${API_BASE}/agendamentos?${qs}`, {
			headers: { Accept: "application/json" },
		});
		if (!res.ok) {
			throw new Error(`Falha ao consultar agendamentos (${res.status})`);
		}
		const payload = (await res.json()) as PaginatedResponse<Appointment>;
		if (
			!Array.isArray(payload?.items) ||
			typeof payload?.page !== "number" ||
			typeof payload?.totalPages !== "number"
		) {
			throw new Error("Resposta inválida do endpoint de agendamentos");
		}
		return payload;
	} catch (err) {
		// Backend BE1 ainda indisponível: usa adapter mock com os mesmos dados do protótipo.
		console.warn(
			"[agendamentos] endpoint indisponível, usando mock:",
			err instanceof Error ? err.message : err,
		);
		await delay(150);
		return listMockAppointments(page, size, filters);
	}
}
