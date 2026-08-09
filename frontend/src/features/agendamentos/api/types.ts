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

export interface ListAppointmentsParams {
	page: number;
	size: number;
}

export const APPOINTMENTS_PAGE_SIZE = 5;
