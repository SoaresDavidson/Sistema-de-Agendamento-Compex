import { useCallback, useState } from "react";
import { clienteService } from "../services/clientes.service";
import type { ClienteResponse } from "../types/cliente.types";

export function useListClient() {
	const [clientes, setClientes] = useState<ClienteResponse[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// callback pois vai ser usado em agendamentos também
	const fetchClientes = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const clientesPage = await clienteService.listClients();
			setClientes(clientesPage.items);
		} catch {
			setError("Não foi possível carregar os clientes.");
		} finally {
			setIsLoading(false);
		}
	}, []);
	return { clientes, isLoading, error, fetchClientes };
}
