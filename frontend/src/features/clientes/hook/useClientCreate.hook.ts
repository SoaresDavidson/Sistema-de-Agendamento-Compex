import { useCallback, useState } from "react";
import { clienteService } from "../services/clientes.service";
import type { ClienteCreate, ClienteResponse } from "../types/cliente.types";

export function useCreateClient() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const createClient = useCallback(
		async (payload: ClienteCreate): Promise<ClienteResponse> => {
			setIsLoading(true);
			setError(null);

			try {
				return await clienteService.createClient(payload);
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	return { createClient, isLoading, error };
}
