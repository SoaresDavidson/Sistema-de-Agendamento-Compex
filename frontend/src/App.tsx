import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./components/layout/Dashboard";
import { AgendamentosPage } from "./features/agendamentos/pages/AgendamentosPage";
import { ClientCadastro } from "./features/clientes/components/ClientCadastro";
import { ClientesPage } from "./features/clientes/pages/ClientesPage";

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<DashboardLayout />}>
					<Route index element={<Navigate to="agendamentos" replace />} />
					<Route path="agendamentos" element={<AgendamentosPage />} />
					<Route path="clientes" element={<ClientesPage />} />
					<Route path="clientes/cadastro" element={<ClientCadastro />} />
					<Route path="clientes/:id/editar" element={<ClientCadastro />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
}
