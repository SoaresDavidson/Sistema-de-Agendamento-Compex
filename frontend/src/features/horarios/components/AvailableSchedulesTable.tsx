import type {
	HorarioDisponivelResponse,
	MedicoResponse,
} from "@/api/generated";
import {
	Table,
	TableWrap,
	TBody,
	TD,
	TH,
	THead,
	TR,
} from "@/components/ui/Table";

interface AvailableSchedulesTableProps {
	schedules: HorarioDisponivelResponse[];
	doctors: MedicoResponse[];
}

function formatDate(value: string) {
	return new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(value));
}

function formatTime(value: string) {
	return new Intl.DateTimeFormat("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
		timeZone: "UTC",
	}).format(new Date(value));
}

function getSpecialties(medicoId: string, doctors: MedicoResponse[]) {
	return doctors
		.find((doctor) => doctor.id === medicoId)
		?.especialidades.map((specialty) => specialty.nome)
		.join(", ");
}

export function AvailableSchedulesTable({
	schedules,
	doctors,
}: AvailableSchedulesTableProps) {
	return (
		<TableWrap>
			<Table>
				<caption className="sr-only">
					Horários disponíveis ordenados por data e horário crescentes
				</caption>
				<THead>
					<TR>
						<TH>Data</TH>
						<TH>Horário</TH>
						<TH>Médico</TH>
						<TH>Especialidade</TH>
						<TH>Situação</TH>
					</TR>
				</THead>
				<TBody>
					{schedules.map((schedule) => (
						<TR key={schedule.id}>
							<TD className="mono">{formatDate(schedule.inicio)}</TD>
							<TD className="mono">
								{formatTime(schedule.inicio)}–{formatTime(schedule.fim)}
							</TD>
							<TD>{schedule.medico.nome}</TD>
							<TD>{getSpecialties(schedule.medico.id, doctors) || "—"}</TD>
							<TD>
								<span className="status status-disponivel">DISPONÍVEL</span>
							</TD>
						</TR>
					))}
				</TBody>
			</Table>
		</TableWrap>
	);
}
