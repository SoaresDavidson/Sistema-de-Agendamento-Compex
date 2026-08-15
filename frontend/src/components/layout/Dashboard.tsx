import { Outlet } from "react-router-dom";
import { ToastProvider } from "@/components/ui/Toast";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";

export function DashboardLayout() {
	return (
		<div className="app-shell">
			<DashboardSidebar />

			<div className="workspace">
				<DashboardHeader />

				<ToastProvider>
					<main className="outlet">
						<Outlet />
					</main>
				</ToastProvider>
			</div>
		</div>
	);
}
