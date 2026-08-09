import { listMockAppointments } from "./mockAppointments";
import type {
	Appointment,
	ListAppointmentsParams,
	PaginatedResponse,
} from "./types";

const API_BASE = "/api";

async function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listAppointments({
	page,
	size,
}: ListAppointmentsParams): Promise<PaginatedResponse<Appointment>> {
	try {
		const res = await fetch(
			`${API_BASE}/agendamentos?page=${page}&size=${size}`,
			{ headers: { Accept: "application/json" } },
		);
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
		return listMockAppointments(page, size);
	}
}
