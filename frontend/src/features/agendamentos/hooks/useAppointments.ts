import { useCallback, useEffect, useState } from "react";
import { listAppointments } from "../api/appointmentsApi";
import {
	APPOINTMENTS_PAGE_SIZE,
	type Appointment,
	type AppointmentFilters,
	type PaginatedResponse,
} from "../api/types";

interface UseAppointmentsResult {
	data: PaginatedResponse<Appointment> | null;
	loading: boolean;
	error: string | null;
	page: number;
	setPage: (page: number) => void;
	refresh: () => void;
}

export function useAppointments(
	initialPage = 1,
	filters: AppointmentFilters = {},
): UseAppointmentsResult {
	const [page, setPage] = useState(initialPage);
	const [data, setData] = useState<PaginatedResponse<Appointment> | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchPage = useCallback(
		async (target: number, currentFilters: AppointmentFilters) => {
			setLoading(true);
			setError(null);
			try {
				const result = await listAppointments({
					page: target,
					size: APPOINTMENTS_PAGE_SIZE,
					filters: currentFilters,
				});
				setData(result);
				setPage(result.page);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Não foi possível carregar os agendamentos.",
				);
				setData(null);
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	useEffect(() => {
		void fetchPage(page, filters);
	}, [page, filters, fetchPage]);

	const refresh = useCallback(() => {
		void fetchPage(page, filters);
	}, [fetchPage, page, filters]);

	return { data, loading, error, page, setPage, refresh };
}
