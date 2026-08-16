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
import type { EspecialidadeResponse } from "../types/especialidade.types";

interface EspecialidadeTableProp {
	especialidades: EspecialidadeResponse[];
	onEditar?: (especialidade: EspecialidadeResponse) => void;
}

const COLUMNS = ["Especialidade ", "Médicos associados", "Uso"];

export function EspecialidadeTable({
	especialidades,
	onEditar,
}: EspecialidadeTableProp) {
	return (
		<TableWrap>
			<Table>
				<THead>
					<TR>
						{COLUMNS.map((column) => (
							<TH key={column}>{column}</TH>
						))}
						{onEditar && <TH style={{ textAlign: "right" }}>Ações</TH>}
					</TR>
				</THead>
				<TBody>
					{especialidades.map((especialidade) => (
						<TR key={especialidade.id}>
							<TD>
								<div className="flex flex-col">
									<span className="primary-cell">{especialidade.nome}</span>
								</div>
							</TD>
							<TD>
								<span className="">placeholder medicos associados</span>
							</TD>
							<TD>
								<span className="secondary-cell">placeholder uso</span>
							</TD>
							{onEditar && (
								<TD>
									<div className="table-actions">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onEditar(especialidade)}
										>
											Editar
										</Button>
									</div>
								</TD>
							)}
						</TR>
					))}
				</TBody>
			</Table>
		</TableWrap>
	);
}
