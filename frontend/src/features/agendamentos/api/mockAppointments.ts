import type { Appointment, PaginatedResponse } from "./types";
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
		status: "CANCELADO",
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

export function listMockAppointments(
	page: number,
	size: number = APPOINTMENTS_PAGE_SIZE,
): PaginatedResponse<Appointment> {
	const items = sorted(MOCK_APPOINTMENTS);
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
