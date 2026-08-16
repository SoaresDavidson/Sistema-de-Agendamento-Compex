import {
	Table,
	TableWrap,
	TBody,
	TD,
	TH,
	THead,
	TR,
} from "@/components/ui/Table";
import type { MedicoResponse } from "../types/medico.types";

interface MedicosTableProps {
	medicos: MedicoResponse[];
}

export function MedicosTable({ medicos }: MedicosTableProps) {
	return (
		<TableWrap>
			<Table id="medicos-table">
				<THead>
					<TR>
						<TH>Nome</TH>
						<TH>Especialidades</TH>
					</TR>
				</THead>
				<TBody>
					{medicos.map((medico) => (
						<TR key={medico.id}>
							<TD>
								<span className="primary-cell">{medico.nome}</span>
							</TD>
							<TD>
								<ul
									className="flex flex-wrap gap-2"
									aria-label="Especialidades"
								>
									{medico.especialidades.map((especialidade) => (
										<li
											key={especialidade.id}
											className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
										>
											{especialidade.nome}
										</li>
									))}
								</ul>
							</TD>
						</TR>
					))}
				</TBody>
			</Table>
		</TableWrap>
	);
}
