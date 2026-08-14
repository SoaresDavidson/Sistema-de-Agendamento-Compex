import { useEffect, useMemo, useState } from "react";
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
import { useToast } from "@/components/ui/Toast";
import { cancelarAgendamento } from "../api/appointmentsApi";
import {
	extractFilterOptions,
	MOCK_APPOINTMENTS,
} from "../api/mockAppointments";
import type {
	Appointment,
	AppointmentFilters,
	CancelamentoOrigem,
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

function hasActiveFilters(
	filters: AppointmentFilters,
	rawClientSearch: string,
): boolean {
	const trimmed = rawClientSearch.trim();
	return (
		trimmed !== "" ||
		filters.cliente !== undefined ||
		filters.medico !== undefined ||
		filters.especialidade !== undefined ||
		filters.status !== undefined ||
		filters.data !== undefined
	);
}

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

	const { data, loading, error, page, setPage, refresh } = useAppointments(
		1,
		filters,
	);
	const [alvoCancelamento, setAlvoCancelamento] = useState<Appointment | null>(
		null,
	);
	const [cancelando, setCancelando] = useState(false);
	const [erroCancelamento, setErroCancelamento] = useState<string | null>(null);
	const { showToast } = useToast();

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

	const mensagemSucesso = (origem: CancelamentoOrigem) =>
		origem === "CLIENTE"
			? "O horário permaneceu ativo e voltou a ficar disponível."
			: "O horário foi desativado por indisponibilidade do médico.";

	const handleConfirmarCancelamento = async (payload: CancelamentoPayload) => {
		if (alvoCancelamento === null || cancelando) return;
		setCancelando(true);
		setErroCancelamento(null);
		try {
			await cancelarAgendamento(alvoCancelamento.id, payload);
			const origem = payload.origem;
			setAlvoCancelamento(null);
			showToast("Agendamento cancelado", mensagemSucesso(origem));
			refresh();
		} catch (err) {
			setErroCancelamento(
				err instanceof Error
					? err.message
					: "Não foi possível cancelar o agendamento.",
			);
		} finally {
			setCancelando(false);
		}
	};

	const handleAbrirCancelamento = (a: Appointment) => {
		setErroCancelamento(null);
		setAlvoCancelamento(a);
	};

	return (
		<section className="min-w-0">
			<header className="page-head">
				<div>
					<h1>Agendamentos</h1>
					<p>
						Consulte atendimentos futuros e históricos. O estado concluído é
						calculado pelo fim do horário.
					</p>
				</div>
			</header>

			<div className="min-w-0" aria-busy={loading}>
				<AppointmentsFilters
					filters={filters}
					medicos={medicos}
					especialidades={especialidades}
					clientSearchValue={rawClientSearch}
					onClientSearchChange={setRawClientSearch}
					onFiltersChange={handleFiltersChange}
					onClear={handleClear}
				/>

				<div className="appointments-summary">
					<span className="breadcrumb" aria-live="polite">
						{data
							? `${data.total} resultado${data.total === 1 ? "" : "s"}`
							: "—"}
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
					<ErrorState icon="!" message={error} onRetry={() => setPage(page)} />
				)}

				{!loading && !error && data && data.items.length > 0 && (
					<>
						<AppointmentsTable
							appointments={data.items}
							onCancelar={handleAbrirCancelamento}
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
					<Empty className="table-wrap" role="status" aria-live="polite">
						{hasActiveFilters(filters, rawClientSearch) ? (
							<>
								<EmptyHeader>
									<EmptyMedia variant="icon" className="empty-mark">
										⌕
									</EmptyMedia>
									<EmptyTitle>Nenhum agendamento encontrado</EmptyTitle>
									<EmptyDescription>
										Revise os filtros ou limpe a busca para voltar à listagem
										completa.
									</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Button variant="secondary" onClick={handleClear}>
										Limpar filtros
									</Button>
								</EmptyContent>
							</>
						) : (
							<EmptyHeader>
								<EmptyMedia variant="icon" className="empty-mark">
									⌕
								</EmptyMedia>
								<EmptyTitle>Nenhum agendamento</EmptyTitle>
								<EmptyDescription>
									Ainda não há agendamentos cadastrados.
								</EmptyDescription>
							</EmptyHeader>
						)}
					</Empty>
				)}
			</div>

			<CancelamentoModal
				open={alvoCancelamento !== null}
				agendamento={alvoCancelamento}
				onConfirm={handleConfirmarCancelamento}
				onClose={() => setAlvoCancelamento(null)}
				submitting={cancelando}
				error={erroCancelamento ?? undefined}
			/>
		</section>
	);
}
