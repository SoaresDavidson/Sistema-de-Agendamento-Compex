import { NavLink, Outlet } from "react-router-dom";
import { AgendamentosNavLink } from "@/features/agendamentos/components/AgendamentosNavLink";

function getCurrentDate(date = new Date()) {
	const parts = new Intl.DateTimeFormat("pt-BR", {
		weekday: "long",
		day: "2-digit",
		month: "long",
		year: "numeric",
	}).formatToParts(date);

	const getPart = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((part) => part.type === type)?.value ?? "";

	return `${getPart("weekday")} - ${getPart("day")} ${getPart("month")} ${getPart("year")}`;
}

export function DashboardLayout() {
	return (
		<div className="app-shell">
			<aside className="sticky flex h-screen flex-col border-r border-border bg-card p-4 font-sans">
				<div className="top-0 px-2 py-5 font-heading text-xl font-bold">
					Clínica Aurora
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

			<div className="min-w-0">
				<header className="sticky top-0 flex h-18 items-center justify-between border-b border-border  px-8">
					<p className="font-sans text-sm text-muted-foreground">
						Clínica Aurora /{" "}
						<strong className="font-semibold text-foreground">
							Agendamentos
						</strong>
					</p>
					<p className="font-mono text-xs uppercase text-muted-foreground">
						{getCurrentDate()}
					</p>
				</header>

				<main className="p-8 font-sans">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
