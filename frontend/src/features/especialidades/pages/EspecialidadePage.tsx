import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/Button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/Empty";
import { ErrorState } from "@/components/ui/Error";
import { EspecialidadeSkeleton } from "../components/EspecialidadeSkeleton";
import { EspecialidadesHeader } from "../components/EspecialidadesHeader";
import { EspecialidadeTable } from "../components/EspecialidadesTable";
import { useListEspecialidade } from "../hook/useListEspecialidade.hook";

export function EspecialidadesPage() {
	const {
		especialidades,
		isLoading,
		error,
		nextCursor,
		fetchEspecialidades,
		loadMore,
	} = useListEspecialidade();
	const navigate = useNavigate();
	const [hasLoaded, setHasLoaded] = useState(false);
	useEffect(() => {
		let isActive = true;

		void fetchEspecialidades().finally(() => {
			if (isActive) setHasLoaded(true);
		});

		return () => {
			isActive = false;
		};
	}, [fetchEspecialidades]);
	return (
		<section>
			<EspecialidadesHeader />
			{!hasLoaded || isLoading ? (
				<EspecialidadeSkeleton />
			) : error ? (
				<ErrorState
					message={error}
					onRetry={() => void fetchEspecialidades()}
				/>
			) : especialidades.length === 0 ? (
				<Empty className="border border-border bg-card py-16">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Users aria-hidden="true" />
						</EmptyMedia>
						<EmptyTitle>Nenhuma especialidade cadastrada</EmptyTitle>
						<EmptyDescription>
							Cadastre primeira especialidade para começar
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button
							variant="primary"
							onClick={() => {}} // modal de cadastro
						>
							Cadastrar Especialiade
						</Button>
					</EmptyContent>
				</Empty>
			) : (
				<EspecialidadeTable
					especialidades={especialidades}
					onEditar={(especialidade) =>
						navigate(`"especialidades/${especialidade.id}/editar"`, {
							state: { especialidade },
						})
					}
				/>
			)}
		</section>
	);
}
