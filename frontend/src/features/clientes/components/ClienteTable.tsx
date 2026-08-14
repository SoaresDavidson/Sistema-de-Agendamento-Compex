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
import type { ClienteResponse } from "../types/cliente.types";

interface ClienteTableProps {
	clientes: ClienteResponse[];
	onEditar?: (cliente: ClienteResponse) => void;
	
}

const COLUMNS = ["Cliente", "Telefone", "E-mail"] as const;

export function ClienteTable({ clientes, onEditar }: ClienteTableProps) {
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
					{clientes.map((cliente) => (
						<TR key={cliente.id}>
							<TD>
								<div className="flex flex-col">
									<span className="primary-cell">{cliente.nome}</span>
									<span className="secondary-cell">Nascimento: {cliente.data_nascimento}</span>
								</div>
							</TD>
							<TD>{cliente.telefone}</TD>
							<TD>{cliente.email ?? "Não informado"}</TD>
							{onEditar && (
								<TD>
									<div className="table-actions">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onEditar(cliente)}
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
