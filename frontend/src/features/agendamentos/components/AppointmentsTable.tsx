import { Button } from "@/components/ui/Button";
import {
	Table,
	TableWrap,
	TBody,
	TD,
	TH,
	THead,
	TR,
} from "@/components/ui/Table";
import type { Appointment } from "../api/types";
import { StatusBadge } from "./StatusBadge";

interface AppointmentsTableProps {
	appointments: Appointment[];
	onCancelar?: (a: Appointment) => void;
}

const COLUMNS = [
	"Cliente",
	"Médico",
	"Especialidade",
	"Data",
	"Horário",
	"Status",
	"Ações",
] as const;

export function AppointmentsTable({
	appointments,
	onCancelar,
}: AppointmentsTableProps) {
	return (
		<TableWrap>
			<Table>
				<THead>
					<TR>
						{COLUMNS.map((col) => (
							<TH
								key={col}
								style={col === "Ações" ? { textAlign: "right" } : undefined}
							>
								{col}
							</TH>
						))}
					</TR>
				</THead>
				<TBody>
					{appointments.map((a) => (
						<TR key={a.id}>
							<TD>
								<span className="primary-cell">{a.cliente}</span>
							</TD>
							<TD>{a.medico}</TD>
							<TD>{a.especialidade}</TD>
							<TD className="mono">{a.data}</TD>
							<TD className="mono">{a.horario}</TD>
							<TD>
								<StatusBadge status={a.status} />
							</TD>
							<TD>
								<div className="table-actions">
									<Button variant="ghost" size="sm" data-action="detalhes">
										Detalhes
									</Button>
									{a.status === "AGENDADO" && (
										<Button
											variant="ghost"
											size="sm"
											data-action="cancelar"
											onClick={() => onCancelar?.(a)}
										>
											Cancelar
										</Button>
									)}
								</div>
							</TD>
						</TR>
					))}
				</TBody>
			</Table>
		</TableWrap>
	);
}
