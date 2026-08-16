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

const ROWS = ["1", "2", "3", "4", "5"] as const;

export function MedicosSkeleton() {
	return (
		<TableWrap aria-busy="true" aria-label="Carregando médicos">
			<Table>
				<THead>
					<TR>
						<TH>Nome</TH>
						<TH>Especialidades</TH>
					</TR>
				</THead>
				<TBody>
					{ROWS.map((row) => (
						<TR key={row}>
							<TD>
								<Skeleton className="h-5 w-48" />
							</TD>
							<TD>
								<Skeleton className="h-6 w-64" />
							</TD>
						</TR>
					))}
				</TBody>
			</Table>
		</TableWrap>
	);
}
