import { AgendamentosNavLink } from "@/features/agendamentos/components/AgendamentosNavLink";
import { ClienteNavLink } from "@/features/clientes/components/ClienteNavLink";
import { EspecialidadeNavLink } from "@/features/especialidades/components/EspecialidadeNavLink";
import { HorariosNavLink } from "@/features/horarios/components/HorariosNavLink";

export function DashboardSidebar() {
	return (
		<aside className="dashboard-sidebar" aria-label="Navegação principal">
			<div className="sidebar-brand">
				<div className="grid size-9 place-items-center rounded-control border border-primary font-mono text-xs text-primary">
					CA
				</div>
				<span className="sidebar-brand-label">Clínica Aurora</span>
			</div>
			<nav className="mt-4 grid gap-1">
				<AgendamentosNavLink />
				<ClienteNavLink />
				<EspecialidadeNavLink />
				<HorariosNavLink />
			</nav>
			<footer className="sidebar-footer mt-auto border-t border-border px-2 pt-4 text-xs text-muted-foreground">
				<p>Agendamento clínico</p>
			</footer>
		</aside>
	);
}
