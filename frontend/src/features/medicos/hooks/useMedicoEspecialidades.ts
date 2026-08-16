import { useEffect, useState } from "react";
import { medicosService } from "../services/medicos.service";
import type { EspecialidadeResponse } from "../types/medico.types";

export function useMedicoEspecialidades() {
	const [especialidades, setEspecialidades] = useState<EspecialidadeResponse[]>(
		[],
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const controller = new AbortController();
		void medicosService
			.listEspecialidades(controller.signal)
			.then(setEspecialidades)
			.catch(() => {
				if (!controller.signal.aborted) {
					setError("Não foi possível carregar as especialidades.");
				}
			})
			.finally(() => {
				if (!controller.signal.aborted) setIsLoading(false);
			});

		return () => controller.abort();
	}, []);

	return { especialidades, isLoading, error };
}
