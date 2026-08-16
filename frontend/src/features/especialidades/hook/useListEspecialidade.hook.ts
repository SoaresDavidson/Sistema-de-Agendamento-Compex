import { useCallback, useEffect, useRef, useState } from "react";
import { especialidadeService } from "../services/especialidades.service";
import type { EspecialidadeResponse } from "../types/especialidade.types";

export function useListEspecialidade() {
	const [especialidades, setEspecialidades] = useState<EspecialidadeResponse[]>(
		[],
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const activeRequestRef = useRef(0);
	const nextCursorRef = useRef<string | null>(null);
	const isLoadingRef = useRef(false);

	const fetchPage = useCallback(
		async (cursor: string | null, append: boolean) => {
			const requestId = ++activeRequestRef.current;
			isLoadingRef.current = true;
			setIsLoading(true);
			setError(null);

			try {
				const especialidadePage =
					await especialidadeService.listEspecialidades(cursor);
				if (requestId !== activeRequestRef.current) return;

				setEspecialidades((current) =>
					append
						? [...current, ...especialidadePage.items]
						: especialidadePage.items,
				);
				nextCursorRef.current = especialidadePage.next_cursor;
				setNextCursor(especialidadePage.next_cursor);
			} catch {
				if (requestId !== activeRequestRef.current) return;
				setError("Não foi possível carregar as especialidades.");
			} finally {
				if (requestId === activeRequestRef.current) {
					isLoadingRef.current = false;
					setIsLoading(false);
				}
			}
		},
		[],
	);

	const fetchEspecialidades = useCallback(async () => {
		await fetchPage(null, false);
	}, [fetchPage]);

	const loadMore = useCallback(async () => {
		const cursor = nextCursorRef.current;
		if (!cursor || isLoadingRef.current) return;

		await fetchPage(cursor, true);
	}, [fetchPage]);

	useEffect(
		() => () => {
			activeRequestRef.current += 1;
			isLoadingRef.current = false;
		},
		[],
	);

	return {
		especialidades,
		isLoading,
		error,
		nextCursor,
		fetchEspecialidades,
		loadMore,
	};
}
