import { useCallback, useState } from "react";
import { especialidadeService } from "../services/especialidades.service";
import type {
	EspecialidadeCreate,
	EspecialidadeResponse,
} from "../types/especialidade.types";

export function useCreateEspecialidade() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const createEspecialidade = useCallback(
		async (payload: EspecialidadeCreate): Promise<EspecialidadeResponse> => {
			setIsLoading(true);
			setError(null);

			try {
				return await especialidadeService.createEspecialidade(payload);
			} catch (error) {
				const createError =
					error instanceof Error
						? error
						: new Error("Não foi possível criar a especialidade.");
				setError(createError);
				throw createError;
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	return { createEspecialidade, isLoading, error };
}
