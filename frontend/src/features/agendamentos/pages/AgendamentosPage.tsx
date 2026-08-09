import { ErrorState } from "@/components/ui/Error";
import { Skeleton } from "@/components/ui/Skeleton";
import { AppointmentsPagination } from "../components/AppointmentsPagination";
import { AppointmentsTable } from "../components/AppointmentsTable";
import { useAppointments } from "../hooks/useAppointments";

const SKELETON_IDS = ["1", "2", "3", "4", "5"] as const;

export function AgendamentosPage() {
	const { data, loading, error, page, setPage } = useAppointments(1);

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
						<AppointmentsTable appointments={data.items} />
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
		</section>
	);
}
