import { NavLink } from "react-router-dom";
import { CalendarDays } from "lucide-react";


export function AgendamentosNavLink() {
	return (
		<NavLink
			to="/agendamentos"
			className={({ isActive }) =>
				`flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-semibold ${
					isActive
						? "bg-muted text-primary"
						: "text-muted-foreground hover:bg-background"
				}`
			}
		>
			<CalendarDays
				aria-hidden="true"
				className="size-4.5 flex-none"
				strokeWidth={1.8}
			/>
			<span>Agendamentos</span>
		</NavLink>
	);
}
