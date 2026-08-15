import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./components/layout/Dashboard";
import { AgendamentosPage } from "./features/agendamentos/pages/AgendamentosPage";
import { ClientCadastro } from "./features/clientes/components/ClientCadastro";
import { ClientesPage } from "./features/clientes/pages/ClientesPage";
import { HorariosPage } from "./features/horarios/pages/HorariosPage";
import { HorarioFormPage } from "./features/horarios/pages/HorarioFormPage";

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<DashboardLayout />}>
					<Route index element={<Navigate to="agendamentos" replace />} />
					<Route path="agendamentos" element={<AgendamentosPage />} />
					<Route path="horarios" element={<HorariosPage />} />
					<Route path="horarios/novo" element={<HorarioFormPage />} />
					<Route path="clientes" element={<ClientesPage />} />
					<Route path="clientes/cadastro" element={<ClientCadastro />} />
					<Route path="clientes/:id/editar" element={<ClientCadastro />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
}
