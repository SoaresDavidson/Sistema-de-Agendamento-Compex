import type {
	Appointment,
	AppointmentFilters,
	PaginatedResponse,
} from "./types";
import { APPOINTMENTS_PAGE_SIZE } from "./types";

const MOCK_APPOINTMENTS: Appointment[] = [
	{
		id: "a1",
		cliente: "Ana Paula Ribeiro",
		medico: "Dra. Mariana Alves",
		especialidade: "Cardiologia",
		data: "10/08/2026",
		horario: "08:00–09:00",
		status: "AGENDADO",
	},
	{
		id: "a2",
		cliente: "Bruno Henrique Lima",
		medico: "Dr. Rafael Monteiro",
		especialidade: "Dermatologia",
		data: "10/08/2026",
		horario: "09:00–10:00",
		status: "AGENDADO",
	},
	{
		id: "a3",
		cliente: "Carla Mendes Nogueira",
		medico: "Dra. Lúcia Fernandes",
		especialidade: "Endocrinologia",
		data: "10/08/2026",
		horario: "10:00–11:00",
		status: "AGENDADO",
	},
	{
		id: "a4",
		cliente: "Daniel Oliveira Costa",
		medico: "Dr. Caio Vasconcelos",
		especialidade: "Ortopedia",
		data: "11/08/2026",
		horario: "14:00–15:00",
		status: "AGENDADO",
	},
	{
		id: "a5",
		cliente: "Elisa Martins Rocha",
		medico: "Dra. Patrícia Gomes",
		especialidade: "Ginecologia",
		data: "05/08/2026",
		horario: "11:00–12:00",
		status: "CONCLUIDO",
	},
	{
		id: "a6",
		cliente: "Fábio Sousa Almeida",
		medico: "Dra. Mariana Alves",
		especialidade: "Clínica médica",
		data: "04/08/2026",
		horario: "15:00–16:00",
		status: "CONCLUIDO",
	},
	{
		id: "a7",
		cliente: "Gabriela Freitas Melo",
		medico: "Dr. Rafael Monteiro",
		especialidade: "Dermatologia",
		data: "12/08/2026",
		horario: "08:00–09:00",
		status: "CANCELADO",
	},
	{
		id: "a8",
		cliente: "Helena Barros Cavalcante",
		medico: "Dra. Lúcia Fernandes",
		especialidade: "Endocrinologia",
		data: "13/08/2026",
		horario: "16:00–17:00",
		status: "AGENDADO",
	},
	{
		//Felipe: repetindo um agendamento para mais tarde me lembrar de fazer isso quando o backend estiver pronto
		id: "a9",
		cliente: "Felipe Soares",
		medico: "Dra. Lúcia Fernandes",
		especialidade: "Endocrinologia",
		data: "13/08/2026",
		horario: "16:00–17:00",
		status: "AGENDADO",
	},
];

function toIso(pt: string): string {
	const [dia, mes, ano] = pt.split("/");
	return `${ano}-${mes}-${dia}`;
}

function sorted(items: Appointment[]): Appointment[] {
	return [...items].sort((a, b) => {
		const ka = `${toIso(a.data)} ${a.horario.slice(0, 5)}`;
		const kb = `${toIso(b.data)} ${b.horario.slice(0, 5)}`;
		return ka.localeCompare(kb);
	});
}

function applyFilters(
	items: Appointment[],
	filters: AppointmentFilters,
): Appointment[] {
	let result = items;
	if (filters.cliente) {
		const q = filters.cliente.toLowerCase();
		result = result.filter((a) => a.cliente.toLowerCase().includes(q));
	}
	if (filters.medico) {
		result = result.filter((a) => a.medico === filters.medico);
	}
	if (filters.especialidade) {
		result = result.filter((a) => a.especialidade === filters.especialidade);
	}
	if (filters.status) {
		result = result.filter((a) => a.status === filters.status);
	}
	if (filters.data) {
		result = result.filter((a) => toIso(a.data) === filters.data);
	}
	return result;
}

export function listMockAppointments(
	page: number,
	size: number = APPOINTMENTS_PAGE_SIZE,
	filters: AppointmentFilters = {},
): PaginatedResponse<Appointment> {
	const filtered = applyFilters(MOCK_APPOINTMENTS, filters);
	const items = sorted(filtered);
	const total = items.length;
	const totalPages = Math.max(1, Math.ceil(total / size));
	const safePage = Math.min(Math.max(1, page), totalPages);
	const start = (safePage - 1) * size;
	const slice = items.slice(start, start + size);
	return {
		items: slice,
		page: safePage,
		size,
		total,
		totalPages,
	};
}

export function extractFilterOptions(appointments: Appointment[]): {
	medicos: string[];
	especialidades: string[];
} {
	const medicos = new Set<string>();
	const especialidades = new Set<string>();
	for (const a of appointments) {
		medicos.add(a.medico);
		especialidades.add(a.especialidade);
	}
	return {
		medicos: [...medicos].sort((x, y) => x.localeCompare(y)),
		especialidades: [...especialidades].sort((x, y) => x.localeCompare(y)),
	};
}

export { MOCK_APPOINTMENTS };
