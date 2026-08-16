import { UserRoundSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/Empty";

interface MedicosEmptyProps {
	hasFilters: boolean;
	onClear: () => void;
	onCadastrar: () => void;
}

export function MedicosEmpty({
	hasFilters,
	onClear,
	onCadastrar,
}: MedicosEmptyProps) {
	return (
		<Empty className="border border-border bg-card py-16" role="status">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<UserRoundSearch aria-hidden="true" />
				</EmptyMedia>
				<EmptyTitle>
					{hasFilters ? "Nenhum médico encontrado" : "Nenhum médico cadastrado"}
				</EmptyTitle>
				<EmptyDescription>
					{hasFilters
						? "Revise os filtros ou limpe a busca para consultar todos os médicos."
						: "Cadastre o primeiro médico para começar."}
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button
					variant={hasFilters ? "secondary" : "primary"}
					onClick={hasFilters ? onClear : onCadastrar}
				>
					{hasFilters ? "Limpar filtros" : "Cadastrar médico"}
				</Button>
			</EmptyContent>
		</Empty>
	);
}
