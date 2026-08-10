import { Outlet } from "react-router-dom";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";

export function DashboardLayout() {
	return (
		<div className="app-shell">
			<DashboardSidebar />

			<div className="min-w-0">
				<DashboardHeader />

				<main className="p-8 font-sans">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
