import { useCallback, useState } from "react";
import { api } from "@/api/api";
import {
	type EspecialidadeCreate,
	type EspecialidadeResponse,
	especialidadeCreateSchema,
	especialidadeResponseSchema,
} from "../types/especialidade.types";

export function usePatchEspecialidade() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const patchEspecialidade = useCallback(
		async (
			especialidadeId: string,
			payload: EspecialidadeCreate,
		): Promise<EspecialidadeResponse> => {
			setIsLoading(true);
			setError(null);

			try {
				const validPayload = especialidadeCreateSchema.parse(payload);
				const response: unknown = await api.patch(
					`/especialidades/${especialidadeId}`,
					validPayload,
				);

				return especialidadeResponseSchema.parse(response);
			} catch (error) {
				const patchError =
					error instanceof Error
						? error
						: new Error("Não foi possível atualizar a especialidade.");
				setError(patchError);
				throw patchError;
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	return { patchEspecialidade, isLoading, error };
}
