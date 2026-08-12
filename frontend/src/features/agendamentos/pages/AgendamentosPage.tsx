import { useEffect, useMemo, useState } from "react";
import { ErrorState } from "@/components/ui/Error";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	extractFilterOptions,
	MOCK_APPOINTMENTS,
} from "../api/mockAppointments";
import type {
	Appointment,
	AppointmentFilters,
	CancelamentoPayload,
} from "../api/types";
import { AppointmentsFilters } from "../components/AppointmentsFilters";
import { AppointmentsPagination } from "../components/AppointmentsPagination";
import { AppointmentsTable } from "../components/AppointmentsTable";
import { CancelamentoModal } from "../components/CancelamentoModal";
import { useAppointments } from "../hooks/useAppointments";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const SKELETON_IDS = ["1", "2", "3", "4", "5"] as const;
const DEBOUNCE_MS = 300;

export function AgendamentosPage() {
	const [rawClientSearch, setRawClientSearch] = useState("");
	const debouncedClientSearch = useDebouncedValue(rawClientSearch, DEBOUNCE_MS);
	const [filters, setFilters] = useState<AppointmentFilters>({});

	useEffect(() => {
		const trimmed = debouncedClientSearch.trim();
		setFilters((prev) =>
			trimmed === ""
				? { ...prev, cliente: undefined }
				: { ...prev, cliente: trimmed },
		);
	}, [debouncedClientSearch]);

	const { data, loading, error, page, setPage } = useAppointments(1, filters);
	const [alvoCancelamento, setAlvoCancelamento] = useState<Appointment | null>(
		null,
	);

	const { medicos, especialidades } = useMemo(
		() => extractFilterOptions(MOCK_APPOINTMENTS),
		[],
	);

	const handleFiltersChange = (next: AppointmentFilters) => {
		setFilters((prev) => ({
			...next,
			cliente: prev.cliente,
		}));
		setPage(1);
	};

	const handleClear = () => {
		setRawClientSearch("");
		setFilters({});
		setPage(1);
	};

	const handleConfirmarCancelamento = (payload: CancelamentoPayload) => {
		if (alvoCancelamento === null) return;
		console.debug("[agendamentos] cancelamento stub:", {
			id: alvoCancelamento.id,
			...payload,
		});
		setAlvoCancelamento(null);
	};

	return (
		<section>
			<header className="mx-auto mb-6 max-w-5xl px-8 pt-12 text-left">
				<h1>Agendamentos</h1>
				<p>
					Consulte atendimentos futuros e históricos. Ordenação por data e
					horário crescentes.
				</p>
			</header>

			<div className="mx-auto max-w-5xl px-8">
				<AppointmentsFilters
					filters={filters}
					medicos={medicos}
					especialidades={especialidades}
					clientSearchValue={rawClientSearch}
					onClientSearchChange={setRawClientSearch}
					onFiltersChange={handleFiltersChange}
					onClear={handleClear}
				/>

				<div className="mb-3 flex items-center justify-between">
					<span className="breadcrumb">
						{data
							? `${data.total} resultado${data.total === 1 ? "" : "s"}`
							: "—"}
					</span>
					<span className="breadcrumb">Ordem: data e horário crescentes</span>
				</div>

				{loading && (
					<div className="table-wrap">
						<div className="flex flex-col gap-4 p-6">
							{SKELETON_IDS.map((id) => (
								<Skeleton key={`skeleton-${id}`} className="h-10 w-full" />
							))}
						</div>
					</div>
				)}

				{!loading && error && (
					<ErrorState icon="!" message={error} onRetry={() => setPage(page)} />
				)}

				{!loading && !error && data && data.items.length > 0 && (
					<>
						<AppointmentsTable
							appointments={data.items}
							onCancelar={setAlvoCancelamento}
						/>
						<AppointmentsPagination
							page={data.page}
							totalPages={data.totalPages}
							total={data.total}
							size={data.size}
							onPageChange={setPage}
						/>
					</>
				)}

				{!loading && !error && data && data.items.length === 0 && (
					<div className="table-wrap p-12 text-center">
						<p>Nenhum agendamento encontrado.</p>
					</div>
				)}
			</div>

			<CancelamentoModal
				open={alvoCancelamento !== null}
				agendamento={alvoCancelamento}
				onConfirm={handleConfirmarCancelamento}
				onClose={() => setAlvoCancelamento(null)}
			/>
		</section>
	);
}
