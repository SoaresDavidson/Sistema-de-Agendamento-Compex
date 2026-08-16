import { useEffect, useRef, useState } from "react";
import { medicosService } from "../services/medicos.service";
import type { MedicoFilters, MedicoResponse } from "../types/medico.types";

const FILTER_DELAY_MS = 300;

export function useMedicos(filters: MedicoFilters) {
	const [medicos, setMedicos] = useState<MedicoResponse[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [reloadKey, setReloadKey] = useState(0);
	const activeRequestRef = useRef(0);
	const activeControllerRef = useRef<AbortController | null>(null);
	const loadingMoreRef = useRef(false);

	const { nome, especialidadeId } = filters;

	useEffect(() => {
		void reloadKey;
		const requestId = ++activeRequestRef.current;
		activeControllerRef.current?.abort();
		const controller = new AbortController();
		activeControllerRef.current = controller;
		loadingMoreRef.current = false;
		setIsLoading(true);
		setIsLoadingMore(false);
		setError(null);

		const timeoutId = window.setTimeout(() => {
			void medicosService
				.list({ nome, especialidadeId }, null, 20, controller.signal)
				.then((page) => {
					if (requestId !== activeRequestRef.current) return;
					setMedicos(page.items);
					setNextCursor(page.next_cursor);
				})
				.catch(() => {
					if (
						controller.signal.aborted ||
						requestId !== activeRequestRef.current
					) {
						return;
					}
					setMedicos([]);
					setNextCursor(null);
					setError("Não foi possível carregar os médicos.");
				})
				.finally(() => {
					if (requestId === activeRequestRef.current) setIsLoading(false);
				});
		}, FILTER_DELAY_MS);

		return () => {
			window.clearTimeout(timeoutId);
			controller.abort();
		};
	}, [nome, especialidadeId, reloadKey]);

	useEffect(
		() => () => {
			activeRequestRef.current += 1;
			activeControllerRef.current?.abort();
			loadingMoreRef.current = false;
		},
		[],
	);

	const loadMore = async () => {
		if (!nextCursor || loadingMoreRef.current) return;

		loadingMoreRef.current = true;
		setIsLoadingMore(true);
		setError(null);
		const requestId = ++activeRequestRef.current;
		activeControllerRef.current?.abort();
		const controller = new AbortController();
		activeControllerRef.current = controller;

		try {
			const page = await medicosService.list(
				{ nome, especialidadeId },
				nextCursor,
				20,
				controller.signal,
			);
			if (requestId !== activeRequestRef.current) return;
			setMedicos((current) => [...current, ...page.items]);
			setNextCursor(page.next_cursor);
		} catch {
			if (
				!controller.signal.aborted &&
				requestId === activeRequestRef.current
			) {
				setError("Não foi possível carregar mais médicos.");
			}
		} finally {
			if (requestId === activeRequestRef.current) {
				loadingMoreRef.current = false;
				setIsLoadingMore(false);
			}
		}
	};

	const refresh = () => setReloadKey((current) => current + 1);

	return {
		medicos,
		isLoading,
		isLoadingMore,
		error,
		nextCursor,
		loadMore,
		refresh,
	};
}
