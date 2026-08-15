import type { EspecialidadeResponse, MedicoResponse } from "@/api/generated";
import { Button } from "@/components/ui/Button";
import type { AvailableScheduleFilters } from "../api/availableSchedulesApi";

interface AvailableSchedulesFiltersProps {
	filters: AvailableScheduleFilters;
	doctors: MedicoResponse[];
	specialties: EspecialidadeResponse[];
	onFiltersChange: (filters: AvailableScheduleFilters) => void;
	onClear: () => void;
}

export function AvailableSchedulesFilters({
	filters,
	doctors,
	specialties,
	onFiltersChange,
	onClear,
}: AvailableSchedulesFiltersProps) {
	const activeFilterCount = Object.values(filters).filter(Boolean).length;
	const visibleDoctors = filters.especialidadeId
		? doctors.filter((doctor) =>
				doctor.especialidades.some(
					(specialty) => specialty.id === filters.especialidadeId,
				),
			)
		: doctors;

	const updateFilter = (patch: Partial<AvailableScheduleFilters>) => {
		onFiltersChange({ ...filters, ...patch });
	};

	return (
		<section
			className="toolbar schedule-filter-bar"
			aria-label="Filtros de horários disponíveis"
		>
			<div className="filter-bar-heading">
				<div>
					<h2>Encontrar um horário</h2>
					<p>Use os filtros para reduzir a agenda ao que você precisa.</p>
				</div>
				<span className="filter-count" aria-live="polite">
					{activeFilterCount === 0
						? "Todos os horários"
						: `${activeFilterCount} filtro${activeFilterCount === 1 ? "" : "s"} ativo${activeFilterCount === 1 ? "" : "s"}`}
				</span>
			</div>
			<div className="field">
				<label htmlFor="schedule-date-filter">Data</label>
				<input
					id="schedule-date-filter"
					className="input"
					type="date"
					value={filters.data ?? ""}
					onChange={(event) =>
						updateFilter({ data: event.target.value || undefined })
					}
				/>
			</div>

			<div className="field">
				<label htmlFor="schedule-doctor">Médico</label>
				<select
					id="schedule-doctor"
					className="select"
					value={filters.medicoId ?? ""}
					onChange={(event) =>
						updateFilter({ medicoId: event.target.value || undefined })
					}
				>
					<option value="">Todos os médicos</option>
					{visibleDoctors.map((doctor) => (
						<option key={doctor.id} value={doctor.id}>
							{doctor.nome}
						</option>
					))}
				</select>
			</div>

			<div className="field">
				<label htmlFor="schedule-specialty">Especialidade</label>
				<select
					id="schedule-specialty"
					className="select"
					value={filters.especialidadeId ?? ""}
					onChange={(event) =>
						updateFilter({
							especialidadeId: event.target.value || undefined,
						})
					}
				>
					<option value="">Todas as especialidades</option>
					{specialties.map((specialty) => (
						<option key={specialty.id} value={specialty.id}>
							{specialty.nome}
						</option>
					))}
				</select>
			</div>

			<div className="toolbar-actions">
				<Button
					variant="secondary"
					onClick={onClear}
					disabled={activeFilterCount === 0}
				>
					Limpar
				</Button>
			</div>
		</section>
	);
}
