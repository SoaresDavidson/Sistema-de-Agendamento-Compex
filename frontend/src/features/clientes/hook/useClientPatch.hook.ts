import { useCallback, useState } from "react";
import { clienteService } from "../services/clientes.service";
import type { ClienteResponse, ClienteUpdate } from "../types/cliente.types";

export function useUpdateClient() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const updateClient = useCallback(
		async (
			clientId: string,
			payload: ClienteUpdate,
		): Promise<ClienteResponse> => {
			setIsLoading(true);
			setError(null);

			try {
				return await clienteService.updateClient(clientId, payload);
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	return { updateClient, isLoading, error };
}
