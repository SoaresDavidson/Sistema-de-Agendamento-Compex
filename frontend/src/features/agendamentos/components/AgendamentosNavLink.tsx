import { NavLink } from "react-router-dom";

export function AgendamentosNavLink() {
	return (
		<NavLink
			to="/agendamentos"
			className={({ isActive }) =>
				`flex min-h-11 items-center rounded-control px-3 text-sm font-semibold ${
					isActive
						? "bg-muted text-primary"
						: "text-muted-foreground hover:bg-background"
				}`
			}
		>
			Agendamentos
		</NavLink>
	);
}
