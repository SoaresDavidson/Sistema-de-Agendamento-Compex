import { useCallback, useEffect, useState } from "react";
import type {
	EspecialidadeResponse,
	HorarioDisponivelResponse,
	MedicoResponse,
} from "@/api/generated";
import {
	type AvailableScheduleFilters,
	listAvailableSchedules,
	listDoctors,
	listSpecialties,
} from "../api/availableSchedulesApi";

interface UseAvailableSchedulesResult {
	schedules: HorarioDisponivelResponse[];
	doctors: MedicoResponse[];
	specialties: EspecialidadeResponse[];
	loading: boolean;
	error: string | null;
	refresh: () => void;
}

export function useAvailableSchedules(
	filters: AvailableScheduleFilters = {},
): UseAvailableSchedulesResult {
	const [schedules, setSchedules] = useState<HorarioDisponivelResponse[]>([]);
	const [doctors, setDoctors] = useState<MedicoResponse[]>([]);
	const [specialties, setSpecialties] = useState<EspecialidadeResponse[]>([]);
	const [loadingSchedules, setLoadingSchedules] = useState(true);
	const [loadingOptions, setLoadingOptions] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [retryKey, setRetryKey] = useState(0);

	useEffect(() => {
		void retryKey;
		let active = true;
		setLoadingOptions(true);
		setError(null);

		void Promise.all([listDoctors(), listSpecialties()])
			.then(([nextDoctors, nextSpecialties]) => {
				if (!active) return;
				setDoctors(nextDoctors);
				setSpecialties(nextSpecialties);
			})
			.catch((err: unknown) => {
				if (!active) return;
				setError(
					err instanceof Error
						? err.message
						: "Não foi possível carregar os filtros de horários.",
				);
			})
			.finally(() => {
				if (active) setLoadingOptions(false);
			});

		return () => {
			active = false;
		};
	}, [retryKey]);

	useEffect(() => {
		void retryKey;
		let active = true;
		setLoadingSchedules(true);
		setError(null);

		void listAvailableSchedules(filters)
			.then((nextSchedules) => {
				if (active) setSchedules(nextSchedules);
			})
			.catch((err: unknown) => {
				if (!active) return;
				setError(
					err instanceof Error
						? err.message
						: "Não foi possível carregar os horários disponíveis.",
				);
			})
			.finally(() => {
				if (active) setLoadingSchedules(false);
			});

		return () => {
			active = false;
		};
	}, [filters, retryKey]);

	const refresh = useCallback(() => {
		setRetryKey((current) => current + 1);
	}, []);

	return {
		schedules,
		doctors,
		specialties,
		loading: loadingSchedules || loadingOptions,
		error,
		refresh,
	};
}
