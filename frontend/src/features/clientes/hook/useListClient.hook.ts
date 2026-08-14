import { useCallback, useState } from "react";
import { clienteService } from "../services/clientes.service";
import type { ClienteResponse } from "../types/cliente.types";

export function useListClient() {
	const [clientes, setClientes] = useState<ClienteResponse[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	// callback pois vai ser usado em agendamentos também
	const fetchClientes = useCallback(async () => {
		setIsLoading(true);
		try {
			const clientesPage = await clienteService.listClients();
			setClientes(clientesPage.items);
		} catch {
		} finally {
			setIsLoading(false);
		}
	}, []);
	return { clientes, isLoading, fetchClientes };
}
