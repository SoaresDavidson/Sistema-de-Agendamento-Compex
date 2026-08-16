import type {
	HorarioDisponivelResponse,
	MedicoResponse,
} from "@/api/generated";
import { ErrorState } from "@/components/ui/Error";
import { Skeleton } from "@/components/ui/Skeleton";

interface TimeSlotSelectionCardProps {
	schedules: HorarioDisponivelResponse[];
	doctors: MedicoResponse[];
	selectedScheduleId: string | null;
	hasActiveFilters: boolean;
	loading: boolean;
	error: string | null;
	onSelectSchedule: (schedule: HorarioDisponivelResponse) => void;
	onRetry: () => void;
}

function formatSlotInterval(startIso: string, endIso: string): string {
	try {
		const start = new Date(startIso);
		const end = new Date(endIso);
		const timeFormat = new Intl.DateTimeFormat("pt-BR", {
			timeZone: "UTC",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		return `${timeFormat.format(start)}–${timeFormat.format(end)}`;
	} catch {
		return `${startIso}–${endIso}`;
	}
}

function formatSlotDate(isoString: string): string {
	try {
		const date = new Date(isoString);
		return new Intl.DateTimeFormat("pt-BR", {
			timeZone: "UTC",
			weekday: "short",
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		}).format(date);
	} catch {
		return isoString.split("T")[0] || "";
	}
}

function getDoctorSpecialty(
	doctorId: string,
	doctors: MedicoResponse[],
): string {
	const doc = doctors.find((d) => d.id === doctorId);
	if (!doc?.especialidades || doc.especialidades.length === 0) {
		return "Consulta Geral";
	}
	return doc.especialidades.map((s) => s.nome).join(", ");
}

export function TimeSlotSelectionCard({
	schedules,
	doctors,
	selectedScheduleId,
	hasActiveFilters,
	loading,
	error,
	onSelectSchedule,
	onRetry,
}: TimeSlotSelectionCardProps) {
	return (
		<article className="card text-left" data-od-id="card-selecao-horario">
			<div className="card-head">
				<div>
					<h2 className="card-title">3. Escolha um horário</h2>
					<p>Selecione um bloco disponível para o atendimento</p>
				</div>
			</div>

			{!hasActiveFilters && (
				<div
					className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground"
					role="status"
				>
					<p className="font-semibold text-foreground">
						Nenhum filtro selecionado
					</p>
					<p className="mt-1">
						Selecione pelo menos um filtro acima (especialidade, médico ou data)
						para visualizar os horários disponíveis.
					</p>
				</div>
			)}

			{hasActiveFilters && loading && (
				<div
					className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
					role="status"
					aria-live="polite"
				>
					<Skeleton className="h-28 w-full rounded-xl" />
					<Skeleton className="h-28 w-full rounded-xl" />
					<Skeleton className="h-28 w-full rounded-xl" />
				</div>
			)}

			{hasActiveFilters && !loading && error && (
				<ErrorState message={error} onRetry={onRetry} />
			)}

			{hasActiveFilters && !loading && !error && schedules.length > 0 && (
				<div className="slot-grid">
					{schedules.map((schedule) => {
						const isSelected = selectedScheduleId === schedule.id;
						const interval = formatSlotInterval(schedule.inicio, schedule.fim);
						const formattedDate = formatSlotDate(schedule.inicio);
						const specialty = getDoctorSpecialty(schedule.medico.id, doctors);

						return (
							<button
								key={schedule.id}
								type="button"
								aria-pressed={isSelected}
								className={`slot ${isSelected ? "selected" : ""}`}
								data-slot={interval}
								onClick={() => onSelectSchedule(schedule)}
							>
								<div className="slot-head">
									<span className="slot-date">{formattedDate}</span>
									<span
										className={`text-xs font-semibold ${
											isSelected ? "text-primary font-bold" : "text-success"
										}`}
									>
										{isSelected ? "Selecionado" : "Disponível"}
									</span>
								</div>

								<div className="my-1">
									<strong className="slot-time">{interval}</strong>
								</div>

								<div>
									<div className="slot-doctor">{schedule.medico.nome}</div>
									<div className="slot-specialty">{specialty}</div>
								</div>
							</button>
						);
					})}
				</div>
			)}

			{hasActiveFilters && !loading && !error && schedules.length === 0 && (
				<div
					className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground"
					role="status"
				>
					<p className="font-semibold text-foreground">
						Nenhum horário disponível encontrado
					</p>
					<p className="mt-1">
						Não encontramos vagas para os filtros selecionados. Tente alterar a
						data, o médico ou a especialidade.
					</p>
				</div>
			)}
		</article>
	);
}
