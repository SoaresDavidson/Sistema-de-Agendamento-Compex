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

const COLUMNS = ["Especialidade", "Médicos associados", "Uso"] as const;
const ROWS = [
	"skeleton-row-1",
	"skeleton-row-2",
	"skeleton-row-3",
	"skeleton-row-4",
	"skeleton-row-5",
	"skeleton-row-6",
] as const;

export function EspecialidadeSkeleton() {
	return (
		<TableWrap aria-busy="true" aria-label="Carregando especialidades">
			<Table>
				<THead>
					<TR>
						{COLUMNS.map((column) => (
							<TH key={column}>{column}</TH>
						))}
					</TR>
				</THead>
				<TBody>
					{ROWS.map((row) => (
						<TR key={row}>
							<TD>
								<Skeleton className="h-6 w-48" />
							</TD>
							<TD>
								<Skeleton className="h-6 w-32" />
							</TD>
							<TD>
								<Skeleton className="h-6 w-24" />
							</TD>
						</TR>
					))}
				</TBody>
			</Table>
		</TableWrap>
	);
}
