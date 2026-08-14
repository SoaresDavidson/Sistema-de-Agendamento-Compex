import type { ClienteResponse } from "@/api/generated";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	Table,
	TableWrap,
	TBody,
	TD,
	TH,
	THead,
	TR,
} from "@/components/ui/Table";

function ClienteCardSkeleton() {
	return (
		<div className="space-y-3">
			<Skeleton className="h-6 w-48" />
		</div>
	);
}
interface ClienteTableProps {
	onEditar?: (cliente: ClienteResponse) => void;
}

const COLUMNS = ["Cliente", "Telefone", "E-mail"] as const;
const ROWS = [
	"skeleton-row-1",
	"skeleton-row-2",
	"skeleton-row-3",
	"skeleton-row-4",
	"skeleton-row-5",
	"skeleton-row-6",
	"skeleton-row-7",
	"skeleton-row-8",
] as const;

export function ClienteSkeleton({ onEditar }: ClienteTableProps) {
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
					{ROWS.map((row) => (
						<TR key={row}>
							{COLUMNS.map((column) => (
								<TD key={column}>
									<ClienteCardSkeleton></ClienteCardSkeleton>
								</TD>
							))}
						</TR>
					))}
				</TBody>
			</Table>
		</TableWrap>
	);
}
