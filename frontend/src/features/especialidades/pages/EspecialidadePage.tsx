import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/Empty";
import { ErrorState } from "@/components/ui/Error";
import { EspecialidadeModal } from "../components/EspecialidadeModal";
import { EspecialidadeSkeleton } from "../components/EspecialidadeSkeleton";
import { EspecialidadesHeader } from "../components/EspecialidadesHeader";
import { EspecialidadeTable } from "../components/EspecialidadesTable";
import { useListEspecialidade } from "../hook/useListEspecialidade.hook";

export function EspecialidadesPage() {
	const {
		especialidades,
		isLoading,
		error,
		fetchEspecialidades,
	} = useListEspecialidade();
	const [especialidadeId, setEspecialidadeId] = useState("");
	const [modalAberto, setModalAberto] = useState(false);
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
			{modalAberto && (
				<EspecialidadeModal
					especialidadeId={especialidadeId}
					onClose={() => {
						setModalAberto(false);
						setEspecialidadeId("");
					}}
				/>
			)}

			<EspecialidadesHeader onClick={setModalAberto}/>
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
							onClick={() => {
								setEspecialidadeId("");
								setModalAberto(true);
							}}
						>
							Cadastrar Especialiade
						</Button>
					</EmptyContent>
				</Empty>
			) : (
				<EspecialidadeTable
					especialidades={especialidades}
					onEditar={(especialidade) => {
						setModalAberto(true);
						setEspecialidadeId(especialidade.id);
					}}
				/>
			)}
		</section>
	);
}
