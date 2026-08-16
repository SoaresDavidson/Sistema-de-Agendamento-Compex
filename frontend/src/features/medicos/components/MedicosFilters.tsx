import { Button } from "@/components/ui/Button";
import type {
	EspecialidadeResponse,
	MedicoFilters,
} from "../types/medico.types";

interface MedicosFiltersProps {
	filters: MedicoFilters;
	especialidades: EspecialidadeResponse[];
	isLoadingEspecialidades: boolean;
	onChange: (filters: MedicoFilters) => void;
	onClear: () => void;
}

export function MedicosFilters({
	filters,
	especialidades,
	isLoadingEspecialidades,
	onChange,
	onClear,
}: MedicosFiltersProps) {
	const hasFilters = Boolean(filters.nome || filters.especialidadeId);

	return (
		<section className="toolbar" aria-label="Filtros de médicos">
			<div className="field search">
				<label htmlFor="medico-filter-name">Nome</label>
				<input
					id="medico-filter-name"
					className="input"
					type="search"
					maxLength={255}
					placeholder="Buscar por nome"
					value={filters.nome}
					onChange={(event) =>
						onChange({ ...filters, nome: event.target.value })
					}
					aria-controls="medicos-table"
				/>
			</div>

			<div className="field">
				<label htmlFor="medico-filter-specialty">Especialidade</label>
				<select
					id="medico-filter-specialty"
					className="select"
					value={filters.especialidadeId}
					disabled={isLoadingEspecialidades}
					onChange={(event) =>
						onChange({
							...filters,
							especialidadeId: event.target.value,
						})
					}
					aria-controls="medicos-table"
				>
					<option value="">
						{isLoadingEspecialidades ? "Carregando..." : "Todas"}
					</option>
					{especialidades.map((especialidade) => (
						<option key={especialidade.id} value={especialidade.id}>
							{especialidade.nome}
						</option>
					))}
				</select>
			</div>

			<div className="toolbar-actions">
				<Button variant="secondary" onClick={onClear} disabled={!hasFilters}>
					Limpar filtros
				</Button>
			</div>
		</section>
	);
}
