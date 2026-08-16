import { useEffect, useState } from "react";
import { api } from "@/api/api";
import { MedicoPage } from "@/api/generated";
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
	const [medicosAssociados, setMedicosAssociados] = useState<
		Record<string, number | null>
	>({});

	useEffect(() => {
		let isActive = true;

		void Promise.all(
			especialidades.map(async (especialidade) => {
				try {
					let total = 0;
					let cursor: string | null = null;

					do {
						const query = new URLSearchParams({
							especialidade_id: especialidade.id,
							limite: "100",
						});
						if (cursor) query.set("cursor", cursor);

						const response = MedicoPage.parse(
							await api.get<unknown>(`/medicos?${query.toString()}`),
						);
						total += response.items.length;
						cursor = response.next_cursor;
					} while (cursor);

					return [especialidade.id, total] as const;
				} catch {
					return [especialidade.id, null] as const;
				}
			}),
		).then((counts) => {
			if (isActive) setMedicosAssociados(Object.fromEntries(counts));
		});

		return () => {
			isActive = false;
		};
	}, [especialidades]);

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
					{especialidades.map((especialidade) => {
						const totalMedicos = medicosAssociados[especialidade.id];

						return (
							<TR key={especialidade.id}>
								<TD>
									<div className="flex flex-col">
										<span className="primary-cell">{especialidade.nome}</span>
									</div>
								</TD>
								<TD>
									<span className="secondary-cell">
										{totalMedicos === undefined
											? "Carregando..."
											: totalMedicos === null
												? "Indisponível"
												: totalMedicos}
									</span>
								</TD>
								<TD>
									<span className="secondary-cell">
										{typeof totalMedicos !== "number"
											? "—"
											: totalMedicos > 0
												? "Associação impede exclusão"
												: "Sem associações"}
									</span>
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
						);
					})}
				</TBody>
			</Table>
		</TableWrap>
	);
}
