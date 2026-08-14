import { Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { AgendamentosNavLink } from "@/features/agendamentos/components/AgendamentosNavLink";

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
				<NavLink
					to="/clientes"
					aria-label="Clientes"
					className={({ isActive }) =>
						`sidebar-nav-link flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-semibold ${
							isActive
								? "bg-muted text-primary"
								: "text-muted-foreground hover:bg-background"
						}`
					}
				>
					<Users
						aria-hidden="true"
						className="size-4.5 flex-none"
						strokeWidth={1.8}
					/>
					<span className="sidebar-nav-label">Clientes</span>
				</NavLink>
			</nav>
			<footer className="sidebar-footer mt-auto border-t border-border px-2 pt-4 text-xs text-muted-foreground">
				<p>Agendamento clínico</p>
			</footer>
		</aside>
	);
}
