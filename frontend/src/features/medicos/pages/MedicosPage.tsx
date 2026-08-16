import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { MedicoModal } from "../components/MedicoModal";
import { MedicosEmpty } from "../components/MedicosEmpty";
import { MedicosFilters } from "../components/MedicosFilters";
import { MedicosHeader } from "../components/MedicosHeader";
import { MedicosSkeleton } from "../components/MedicosSkeleton";
import { MedicosTable } from "../components/MedicosTable";
import { useMedicoEspecialidades } from "../hooks/useMedicoEspecialidades";
import { useMedicos } from "../hooks/useMedicos";
import type { MedicoFilters } from "../types/medico.types";

const EMPTY_FILTERS: MedicoFilters = { nome: "", especialidadeId: "" };

export function MedicosPage() {
	const [filters, setFilters] = useState<MedicoFilters>(EMPTY_FILTERS);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const {
		medicos,
		isLoading,
		isLoadingMore,
		error,
		nextCursor,
		loadMore,
		refresh,
	} = useMedicos(filters);
	const {
		especialidades,
		isLoading: isLoadingEspecialidades,
		error: especialidadesError,
	} = useMedicoEspecialidades();
	const { showToast } = useToast();
	const hasFilters = Boolean(filters.nome || filters.especialidadeId);

	const clearFilters = () => setFilters(EMPTY_FILTERS);

	return (
		<section>
			<MedicosHeader onCadastrar={() => setIsModalOpen(true)} />
			<MedicosFilters
				filters={filters}
				especialidades={especialidades}
				isLoadingEspecialidades={isLoadingEspecialidades}
				onChange={setFilters}
				onClear={clearFilters}
			/>

			<div className="appointments-summary">
				<span className="breadcrumb" aria-live="polite">
					{isLoading
						? "Carregando médicos..."
						: `${medicos.length} médico${medicos.length === 1 ? "" : "s"}`}
				</span>
			</div>

			{isLoading ? (
				<MedicosSkeleton />
			) : error && medicos.length === 0 ? (
				<div className="notice danger" role="alert">
					{error}
				</div>
			) : medicos.length === 0 ? (
				<MedicosEmpty
					hasFilters={hasFilters}
					onClear={clearFilters}
					onCadastrar={() => setIsModalOpen(true)}
				/>
			) : (
				<>
					<MedicosTable medicos={medicos} />
					{error && (
						<p className="field-error mt-3" role="alert">
							{error}
						</p>
					)}
					{nextCursor && (
						<div className="mt-4 flex justify-center">
							<Button
								variant="secondary"
								onClick={() => void loadMore()}
								disabled={isLoadingMore}
								aria-busy={isLoadingMore}
							>
								{isLoadingMore ? "Carregando..." : "Carregar mais"}
							</Button>
						</div>
					)}
				</>
			)}

			{isModalOpen && (
				<MedicoModal
					especialidades={especialidades}
					isLoadingEspecialidades={isLoadingEspecialidades}
					especialidadesError={especialidadesError}
					onClose={() => setIsModalOpen(false)}
					onCreated={(medico) => {
						showToast(
							"Médico cadastrado",
							`${medico.nome} foi cadastrado com sucesso.`,
						);
						refresh();
					}}
				/>
			)}
		</section>
	);
}
