import { Button } from "@/components/ui/Button";
import type { AppointmentFilters } from "../api/types";

interface AppointmentsFiltersProps {
	filters: AppointmentFilters;
	medicos: string[];
	especialidades: string[];
	clientSearchValue: string;
	onClientSearchChange: (value: string) => void;
	onFiltersChange: (next: AppointmentFilters) => void;
	onClear: () => void;
}

const STATUS_OPTIONS = ["AGENDADO", "CANCELADO", "CONCLUIDO"] as const;

export function AppointmentsFilters({
	filters,
	medicos,
	especialidades,
	clientSearchValue,
	onClientSearchChange,
	onFiltersChange,
	onClear,
}: AppointmentsFiltersProps) {
	const updateFilter = (patch: Partial<AppointmentFilters>) => {
		onFiltersChange({ ...filters, ...patch });
	};

	return (
		<section className="toolbar filters-collapsible open" aria-label="Filtros">
			<div className="field search">
				<label htmlFor="appointment-search">Buscar cliente</label>
				<input
					id="appointment-search"
					className="input"
					type="text"
					placeholder="Nome do cliente"
					value={clientSearchValue}
					onChange={(e) => onClientSearchChange(e.target.value)}
				/>
			</div>

			<div className="field">
				<label htmlFor="appointment-doctor">Médico</label>
				<select
					id="appointment-doctor"
					className="select"
					value={filters.medico ?? ""}
					onChange={(e) =>
						updateFilter({
							medico: e.target.value || undefined,
						})
					}
				>
					<option value="">Todos</option>
					{medicos.map((m) => (
						<option key={m} value={m}>
							{m}
						</option>
					))}
				</select>
			</div>

			<div className="field">
				<label htmlFor="appointment-specialty">Especialidade</label>
				<select
					id="appointment-specialty"
					className="select"
					value={filters.especialidade ?? ""}
					onChange={(e) =>
						updateFilter({
							especialidade: e.target.value || undefined,
						})
					}
				>
					<option value="">Todas</option>
					{especialidades.map((e) => (
						<option key={e} value={e}>
							{e}
						</option>
					))}
				</select>
			</div>

			<div className="field">
				<label htmlFor="appointment-status">Status</label>
				<select
					id="appointment-status"
					className="select"
					value={filters.status ?? ""}
					onChange={(e) =>
						updateFilter({
							status:
								(e.target.value as (typeof STATUS_OPTIONS)[number] | "") ||
								undefined,
						})
					}
				>
					<option value="">Todos</option>
					{STATUS_OPTIONS.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
			</div>

			<div className="field">
				<label htmlFor="appointment-date">Data</label>
				<input
					id="appointment-date"
					className="input"
					type="date"
					value={filters.data ?? ""}
					onChange={(e) =>
						updateFilter({
							data: e.target.value || undefined,
						})
					}
				/>
			</div>

			<div className="toolbar-actions">
				<Button variant="secondary" onClick={onClear}>
					Limpar
				</Button>
			</div>
		</section>
	);
}
