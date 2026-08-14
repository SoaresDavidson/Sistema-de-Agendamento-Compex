import type { ClienteResponse } from "@/api/generated";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "@/components/ui/Table";


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
                    {[...Array(8)].map((_, i) => (
                        <TR key={i}>
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
    )
}