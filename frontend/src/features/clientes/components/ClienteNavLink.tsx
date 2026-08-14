import { Users } from "lucide-react";
import { NavLink } from "react-router-dom";

export function ClienteNavLink() {
	return (
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
	);
}
