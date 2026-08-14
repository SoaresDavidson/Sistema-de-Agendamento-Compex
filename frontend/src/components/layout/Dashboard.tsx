import { Outlet } from "react-router-dom";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";

export function DashboardLayout() {
	return (
		<div className="app-shell">
			<DashboardSidebar />

			<div className="workspace">
				<DashboardHeader />

				<main className="outlet">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
