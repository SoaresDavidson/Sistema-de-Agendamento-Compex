export type AppointmentStatus = "AGENDADO" | "CANCELADO" | "CONCLUIDO";

export interface Appointment {
	id: string;
	cliente: string;
	medico: string;
	especialidade: string;
	data: string;
	horario: string;
	status: AppointmentStatus;
}

export interface PaginatedResponse<T> {
	items: T[];
	page: number;
	size: number;
	total: number;
	totalPages: number;
}

export type AppointmentFilters = {
	cliente?: string;
	medico?: string;
	especialidade?: string;
	status?: AppointmentStatus;
	data?: string;
};

export interface ListAppointmentsParams {
	page: number;
	size: number;
	filters?: AppointmentFilters;
}

export const APPOINTMENTS_PAGE_SIZE = 5;

export type CancelamentoOrigem = "CLIENTE" | "MEDICO";

export interface CancelamentoPayload {
	origem: CancelamentoOrigem;
	observacao?: string;
}

export interface CancelamentoResponse {
	id: string;
	status: AppointmentStatus;
	cancelado_por: CancelamentoOrigem | null;
	cancelado_em: string | null;
	observacao_cancelamento: string | null;
}
