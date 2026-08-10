import { NavLink } from "react-router-dom";
import { AgendamentosNavLink } from "@/features/agendamentos/components/AgendamentosNavLink";

export function DashboardSidebar() {
	return (
		<aside className="sticky flex h-screen flex-col border-r border-border bg-card p-4 font-sans">
			<div className="flex items-center gap-3 px-2 py-5 font-heading text-xl font-bold">
				<div className="grid size-9 place-items-center rounded-control border border-primary font-mono text-xs text-primary">
					CA
				</div>
				<span>Clínica Aurora</span>
			</div>
			<nav className="mt-4 grid gap-1">
				<AgendamentosNavLink />
				<NavLink
					to="/clientes"
					className={({ isActive }) =>
						`flex min-h-11 items-center rounded-control px-3 text-sm font-semibold ${
							isActive
								? "bg-muted text-primary"
								: "text-muted-foreground hover:bg-background"
						}`
					}
				>
					Clientes
				</NavLink>
			</nav>
			<footer className="mt-auto border-t border-border px-2 pt-4 text-xs text-muted-foreground">
				<p>Agendamento clínico</p>
			</footer>
		</aside>
	);
}
