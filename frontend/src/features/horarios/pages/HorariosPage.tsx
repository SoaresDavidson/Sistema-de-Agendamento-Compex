import { useState } from "react";
import { Link } from "react-router-dom";
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
import { Skeleton } from "@/components/ui/Skeleton";
import type { AvailableScheduleFilters } from "../api/availableSchedulesApi";
import { AvailableSchedulesFilters } from "../components/AvailableSchedulesFilters";
import { AvailableSchedulesTable } from "../components/AvailableSchedulesTable";
import { useAvailableSchedules } from "../hooks/useAvailableSchedules";

const SKELETON_IDS = ["1", "2", "3", "4", "5"] as const;

function hasActiveFilters(filters: AvailableScheduleFilters) {
	return Object.values(filters).some(Boolean);
}

export function HorariosPage() {
	const [filters, setFilters] = useState<AvailableScheduleFilters>({});
	const { schedules, doctors, specialties, loading, error, refresh } =
		useAvailableSchedules(filters);

	const handleClear = () => setFilters({});

	return (
		<section>
			<header className="page-head mx-auto max-w-5xl px-8 pt-12 text-left">
				<div>
					<h1>Horários</h1>
					<p>
						Consulte os horários que ainda podem receber novos agendamentos. A
						disponibilidade é calculada pelo backend no momento da consulta.
					</p>
				</div>
				<Link className="btn btn-primary" to="/horarios/novo">
					Cadastrar horários
				</Link>
			</header>

			<div className="mx-auto max-w-5xl px-8" aria-busy={loading}>
				<AvailableSchedulesFilters
					filters={filters}
					doctors={doctors}
					specialties={specialties}
					onFiltersChange={setFilters}
					onClear={handleClear}
				/>

				<div className="mb-3 flex items-center justify-between">
					<span className="breadcrumb" aria-live="polite">
						{loading
							? "Carregando horários..."
							: `${schedules.length} horário${schedules.length === 1 ? "" : "s"}`}
					</span>
					<span className="breadcrumb">Ordem: data e horário crescentes</span>
				</div>

				{loading && (
					<div className="table-wrap" role="status" aria-live="polite">
						<div className="flex flex-col gap-4 p-6">
							{SKELETON_IDS.map((id) => (
								<Skeleton key={`skeleton-${id}`} className="h-10 w-full" />
							))}
						</div>
					</div>
				)}

				{!loading && error && (
					<ErrorState icon="!" message={error} onRetry={refresh} />
				)}

				{!loading && !error && schedules.length > 0 && (
					<AvailableSchedulesTable schedules={schedules} doctors={doctors} />
				)}

				{!loading && !error && schedules.length === 0 && (
					<Empty className="table-wrap" role="status" aria-live="polite">
						<EmptyHeader>
							<EmptyMedia variant="icon" className="empty-mark">
								⌕
							</EmptyMedia>
							<EmptyTitle>
								{hasActiveFilters(filters)
									? "Nenhum horário encontrado"
									: "Ainda não há horários disponíveis"}
							</EmptyTitle>
							<EmptyDescription>
								{hasActiveFilters(filters)
									? "Revise os filtros ou limpe a busca para consultar todos os horários."
									: "Os horários aptos para novos agendamentos aparecerão nesta lista."}
							</EmptyDescription>
						</EmptyHeader>
						{hasActiveFilters(filters) && (
							<EmptyContent>
								<Button variant="secondary" onClick={handleClear}>
									Limpar filtros
								</Button>
							</EmptyContent>
						)}
					</Empty>
				)}
			</div>
		</section>
	);
}
