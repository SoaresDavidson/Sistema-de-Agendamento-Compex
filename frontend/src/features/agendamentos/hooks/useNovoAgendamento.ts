import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "@/api/api";
import type {
	ClienteResponse,
	EspecialidadeResponse,
	HorarioDisponivelResponse,
	MedicoResponse,
} from "@/api/generated";
import { useToast } from "@/components/ui/Toast";
import { clienteService } from "@/features/clientes/services/clientes.service";
import {
	listAvailableSchedules,
	listDoctors,
	listSpecialties,
} from "@/features/horarios/api/availableSchedulesApi";
import {
	criarAgendamento,
	getAgendamentoErrorMessage,
} from "../api/appointmentsApi";

function getTodayString(): string {
	const current = new Date();
	return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
}

function formatDisplayDate(dateStr: string): string {
	if (!dateStr) return "";
	const [year, month, day] = dateStr.split("-");
	if (year && month && day) {
		return `${day}/${month}/${year}`;
	}
	return dateStr;
}

function formatSlotInterval(inicio: string, fim: string): string {
	const fmt = (iso: string) =>
		new Intl.DateTimeFormat("pt-BR", {
			hour: "2-digit",
			minute: "2-digit",
			timeZone: "UTC",
		}).format(new Date(iso));
	return `${fmt(inicio)}–${fmt(fim)}`;
}

export function useNovoAgendamento() {
	const location = useLocation();
	const navigate = useNavigate();
	const { showToast } = useToast();

	// Dados da API
	const [clients, setClients] = useState<ClienteResponse[]>([]);
	const [loadingClients, setLoadingClients] = useState(true);
	const [errorClients, setErrorClients] = useState<string | null>(null);

	const [specialties, setSpecialties] = useState<EspecialidadeResponse[]>([]);
	const [doctors, setDoctors] = useState<MedicoResponse[]>([]);
	const [loadingMeta, setLoadingMeta] = useState(true);
	const [errorMeta, setErrorMeta] = useState<string | null>(null);

	const [schedules, setSchedules] = useState<HorarioDisponivelResponse[]>([]);
	const [loadingSchedules, setLoadingSchedules] = useState(false);
	const [errorSchedules, setErrorSchedules] = useState<string | null>(null);

	// Seleções do formulário
	const [selectedClient, setSelectedClient] = useState<ClienteResponse | null>(
		null,
	);
	const [selectedSpecialtyId, setSelectedSpecialtyId] = useState("");
	const [selectedDoctorId, setSelectedDoctorId] = useState("");
	const [selectedDate, setSelectedDate] = useState("");
	const [selectedSchedule, setSelectedSchedule] =
		useState<HorarioDisponivelResponse | null>(null);

	// Estados de submissão e feedback
	const [submitting, setSubmitting] = useState(false);
	const [generalError, setGeneralError] = useState<string | null>(null);
	const [conflictOpen, setConflictOpen] = useState(false);
	const [conflictedSlotInterval, setConflictedSlotInterval] = useState<
		string | null
	>(null);
	const [prefillNoticeVisible, setPrefillNoticeVisible] = useState(false);

	const minDate = useMemo(() => getTodayString(), []);

	// Carrega Clientes
	const fetchClients = useCallback(async () => {
		setLoadingClients(true);
		setErrorClients(null);
		try {
			const page = await clienteService.listClients();
			setClients(page.items);
		} catch (err: unknown) {
			setErrorClients(
				err instanceof Error
					? err.message
					: "Não foi possível carregar os clientes.",
			);
		} finally {
			setLoadingClients(false);
		}
	}, []);

	// Carrega Especialidades e Médicos
	const fetchMeta = useCallback(async () => {
		setLoadingMeta(true);
		setErrorMeta(null);
		try {
			const [specs, docs] = await Promise.all([
				listSpecialties(),
				listDoctors(),
			]);
			setSpecialties(specs);
			setDoctors(docs);
		} catch (err: unknown) {
			setErrorMeta(
				err instanceof Error
					? err.message
					: "Não foi possível carregar especialidades e médicos.",
			);
		} finally {
			setLoadingMeta(false);
		}
	}, []);

	const hasActiveFilters = Boolean(
		selectedDate || selectedDoctorId || selectedSpecialtyId,
	);

	// Carrega Horários Disponíveis
	const fetchSchedules = useCallback(async () => {
		if (!hasActiveFilters) {
			setSchedules([]);
			setLoadingSchedules(false);
			setErrorSchedules(null);
			return;
		}

		setLoadingSchedules(true);
		setErrorSchedules(null);
		try {
			const items = await listAvailableSchedules({
				data: selectedDate || undefined,
				medicoId: selectedDoctorId || undefined,
				especialidadeId: selectedSpecialtyId || undefined,
			});
			setSchedules(items);
		} catch (err: unknown) {
			setErrorSchedules(
				err instanceof Error
					? err.message
					: "Não foi possível consultar os horários disponíveis.",
			);
		} finally {
			setLoadingSchedules(false);
		}
	}, [hasActiveFilters, selectedDate, selectedDoctorId, selectedSpecialtyId]);

	// Inicialização de Clientes e Meta
	useEffect(() => {
		void fetchClients();
		void fetchMeta();
	}, [fetchClients, fetchMeta]);

	// Consulta de horários sempre que filtros mudarem
	useEffect(() => {
		void fetchSchedules();
	}, [fetchSchedules]);

	// Processa Parâmetros de URL (Pré-preenchimento vindo de outros fluxos)
	useEffect(() => {
		if (specialties.length === 0 && doctors.length === 0) return;

		const params = new URLSearchParams(location.search);
		const linkedSchedule = params.get("horario");
		const linkedSpecialty = params.get("especialidade");
		const linkedDoctor = params.get("medico");
		const linkedDate = params.get("data");

		if (linkedSchedule || linkedSpecialty || linkedDoctor || linkedDate) {
			if (linkedSpecialty) {
				const foundSpec = specialties.find(
					(s) =>
						s.nome.toLowerCase() === linkedSpecialty.toLowerCase() ||
						s.id === linkedSpecialty,
				);
				if (foundSpec) setSelectedSpecialtyId(foundSpec.id);
			}

			if (linkedDoctor) {
				const foundDoc = doctors.find(
					(d) =>
						d.nome.toLowerCase() === linkedDoctor.toLowerCase() ||
						d.id === linkedDoctor,
				);
				if (foundDoc) setSelectedDoctorId(foundDoc.id);
			}

			if (linkedDate) {
				setSelectedDate(linkedDate);
			}

			setPrefillNoticeVisible(true);
		}
	}, [location.search, specialties, doctors]);

	// Pré-seleção do slot quando `horario` na URL for id ou intervalo
	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const linkedScheduleId = params.get("horario");
		const linkedHora = params.get("hora");

		if (
			(linkedScheduleId || linkedHora) &&
			schedules.length > 0 &&
			!selectedSchedule
		) {
			const found = schedules.find((s) => {
				if (linkedScheduleId && s.id === linkedScheduleId) return true;
				if (linkedHora && formatSlotInterval(s.inicio, s.fim) === linkedHora) {
					return true;
				}
				return false;
			});
			if (found) {
				setSelectedSchedule(found);
			}
		}
	}, [location.search, schedules, selectedSchedule]);

	// Handlers de seleção
	const handleSelectClient = useCallback((client: ClienteResponse) => {
		setSelectedClient(client);
		setGeneralError(null);
	}, []);

	const handleSpecialtyChange = useCallback(
		(specialtyId: string) => {
			setSelectedSpecialtyId(specialtyId);
			setSelectedSchedule(null);
			setGeneralError(null);
			// Se o médico selecionado não possui a nova especialidade, limpa a seleção de médico
			if (specialtyId && selectedDoctorId) {
				const doc = doctors.find((d) => d.id === selectedDoctorId);
				const hasSpec = doc?.especialidades.some((s) => s.id === specialtyId);
				if (!hasSpec) {
					setSelectedDoctorId("");
				}
			}
		},
		[doctors, selectedDoctorId],
	);

	const handleDoctorChange = useCallback((doctorId: string) => {
		setSelectedDoctorId(doctorId);
		setSelectedSchedule(null);
		setGeneralError(null);
	}, []);

	const handleDateChange = useCallback((date: string) => {
		setSelectedDate(date);
		setSelectedSchedule(null);
		setGeneralError(null);
	}, []);

	const handleSelectSchedule = useCallback(
		(schedule: HorarioDisponivelResponse) => {
			setSelectedSchedule(schedule);
			setGeneralError(null);
		},
		[],
	);

	// Dados formatados para o Card de Revisão
	const clientName = selectedClient?.nome ?? null;

	const specialtyName = useMemo(() => {
		if (selectedSpecialtyId) {
			return (
				specialties.find((s) => s.id === selectedSpecialtyId)?.nome ?? null
			);
		}
		const docId = selectedSchedule?.medico.id || selectedDoctorId;
		if (docId) {
			const doc = doctors.find((d) => d.id === docId);
			if (doc?.especialidades && doc.especialidades.length > 0) {
				return doc.especialidades.map((s) => s.nome).join(", ");
			}
		}
		return null;
	}, [
		selectedSpecialtyId,
		selectedSchedule,
		selectedDoctorId,
		specialties,
		doctors,
	]);

	const doctorName = useMemo(() => {
		if (selectedSchedule) {
			return selectedSchedule.medico.nome;
		}
		if (selectedDoctorId) {
			return doctors.find((d) => d.id === selectedDoctorId)?.nome ?? null;
		}
		return null;
	}, [selectedSchedule, selectedDoctorId, doctors]);

	const dateFormatted = useMemo(() => {
		if (selectedSchedule) {
			return formatDisplayDate(selectedSchedule.inicio.slice(0, 10));
		}
		if (selectedDate) {
			return formatDisplayDate(selectedDate);
		}
		return null;
	}, [selectedSchedule, selectedDate]);

	const timeSlotFormatted = useMemo(() => {
		if (selectedSchedule) {
			return formatSlotInterval(selectedSchedule.inicio, selectedSchedule.fim);
		}
		return null;
	}, [selectedSchedule]);

	const canConfirm = Boolean(selectedClient && selectedSchedule);

	// Submissão do Agendamento
	const handleConfirm = async () => {
		if (!selectedClient || !selectedSchedule || submitting) return;

		setSubmitting(true);
		setGeneralError(null);

		try {
			await criarAgendamento({
				cliente_id: selectedClient.id,
				horario_id: selectedSchedule.id,
			});

			showToast(
				"Agendamento confirmado",
				"O horário foi verificado novamente e reservado para o cliente selecionado.",
			);
			navigate("/agendamentos");
		} catch (err: unknown) {
			const isConflict =
				(err instanceof ApiError && err.status === 409) ||
				(err instanceof Error &&
					err.message.toLowerCase().includes("disponível"));

			if (isConflict) {
				const interval = formatSlotInterval(
					selectedSchedule.inicio,
					selectedSchedule.fim,
				);
				setConflictedSlotInterval(interval);
				setConflictOpen(true);
				setSelectedSchedule(null);
				void fetchSchedules();
			} else {
				setGeneralError(
					getAgendamentoErrorMessage(
						err,
						"Não foi possível confirmar o agendamento. Tente novamente.",
					),
				);
			}
		} finally {
			setSubmitting(false);
		}
	};

	// Cálculo das etapas do Stepper
	const stepClientState = selectedClient ? "step done" : "step active";
	const stepAgendaState =
		selectedDoctorId && selectedDate
			? "step done"
			: selectedClient
				? "step active"
				: "step";
	const stepTimeState = selectedSchedule
		? "step done"
		: selectedDoctorId && selectedDate
			? "step active"
			: "step";
	const stepReviewState =
		selectedClient && selectedSchedule ? "step active" : "step";

	return {
		// Dados
		clients,
		loadingClients,
		errorClients,
		fetchClients,
		specialties,
		doctors,
		loadingMeta,
		errorMeta,
		fetchMeta,
		schedules,
		loadingSchedules,
		errorSchedules,
		fetchSchedules,
		hasActiveFilters,
		minDate,

		// Seleções
		selectedClient,
		selectedSpecialtyId,
		selectedDoctorId,
		selectedDate,
		selectedSchedule,

		// Handlers
		handleSelectClient,
		handleSpecialtyChange,
		handleDoctorChange,
		handleDateChange,
		handleSelectSchedule,
		handleConfirm,

		// Resumo
		clientName,
		specialtyName,
		doctorName,
		dateFormatted,
		timeSlotFormatted,
		canConfirm,
		submitting,
		generalError,

		// Conflito
		conflictOpen,
		conflictedSlotInterval,
		setConflictOpen,

		// Prefill
		prefillNoticeVisible,

		// Stepper
		stepClientState,
		stepAgendaState,
		stepTimeState,
		stepReviewState,
	};
}
