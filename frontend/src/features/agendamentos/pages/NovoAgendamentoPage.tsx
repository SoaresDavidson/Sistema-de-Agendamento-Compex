import { Link } from "react-router-dom";
import { AppointmentConflictModal } from "../components/AppointmentConflictModal";
import { AppointmentSummaryCard } from "../components/AppointmentSummaryCard";
import { ClientSelectionCard } from "../components/ClientSelectionCard";
import { ScheduleFiltersCard } from "../components/ScheduleFiltersCard";
import { TimeSlotSelectionCard } from "../components/TimeSlotSelectionCard";
import { useNovoAgendamento } from "../hooks/useNovoAgendamento";

export function NovoAgendamentoPage() {
	const {
		clients,
		loadingClients,
		errorClients,
		fetchClients,
		specialties,
		doctors,
		schedules,
		loadingSchedules,
		errorSchedules,
		fetchSchedules,
		hasActiveFilters,
		minDate,

		selectedClient,
		selectedSpecialtyId,
		selectedDoctorId,
		selectedDate,
		selectedSchedule,

		handleSelectClient,
		handleSpecialtyChange,
		handleDoctorChange,
		handleDateChange,
		handleSelectSchedule,
		handleConfirm,

		clientName,
		specialtyName,
		doctorName,
		dateFormatted,
		timeSlotFormatted,
		canConfirm,
		submitting,
		generalError,

		conflictOpen,
		conflictedSlotInterval,
		setConflictOpen,

		prefillNoticeVisible,

		stepClientState,
		stepAgendaState,
		stepTimeState,
		stepReviewState,
	} = useNovoAgendamento();

	return (
		<section className="min-w-0" data-od-id="novo-agendamento-cabecalho">
			<header className="page-head">
				<div>
					<h1>Novo agendamento</h1>
					<p>
						Selecione o cliente e refine a agenda. A disponibilidade será
						verificada novamente ao confirmar.
					</p>
				</div>
				<div className="page-actions">
					<Link className="btn btn-secondary" to="/agendamentos">
						Cancelar
					</Link>
				</div>
			</header>

			<section
				className="stepper"
				aria-label="Progresso do agendamento"
				data-od-id="agendamento-etapas"
			>
				<div className={stepClientState} data-step="client">
					1 · Cliente
				</div>
				<div className={stepAgendaState} data-step="agenda">
					2 · Agenda
				</div>
				<div className={stepTimeState} data-step="time">
					3 · Horário
				</div>
				<div className={stepReviewState} data-step="review">
					4 · Revisão
				</div>
			</section>

			{prefillNoticeVisible && (
				<div
					className="notice success mb-4"
					id="schedule-prefill-notice"
					role="status"
					aria-live="polite"
				>
					<div>
						<strong>Horário carregado da agenda</strong>
						<p>
							Médico, especialidade, data e intervalo já estão preenchidos.
							Selecione apenas o cliente para continuar.
						</p>
					</div>
				</div>
			)}

			{generalError && (
				<div className="notice danger mb-4" role="alert" aria-live="assertive">
					<div>
						<strong>Atenção</strong>
						<p>{generalError}</p>
					</div>
				</div>
			)}

			<section className="grid-main" data-od-id="agendamento-formulario">
				<div className="grid">
					<ClientSelectionCard
						clients={clients}
						selectedClient={selectedClient}
						loading={loadingClients}
						error={errorClients}
						onSelectClient={handleSelectClient}
						onRetry={fetchClients}
					/>

					<ScheduleFiltersCard
						specialties={specialties}
						doctors={doctors}
						selectedSpecialtyId={selectedSpecialtyId}
						selectedDoctorId={selectedDoctorId}
						selectedDate={selectedDate}
						onSpecialtyChange={handleSpecialtyChange}
						onDoctorChange={handleDoctorChange}
						onDateChange={handleDateChange}
						minDate={minDate}
					/>

					<TimeSlotSelectionCard
						schedules={schedules}
						doctors={doctors}
						selectedScheduleId={selectedSchedule?.id ?? null}
						hasActiveFilters={hasActiveFilters}
						loading={loadingSchedules}
						error={errorSchedules}
						onSelectSchedule={handleSelectSchedule}
						onRetry={fetchSchedules}
					/>
				</div>

				<AppointmentSummaryCard
					clientName={clientName}
					specialtyName={specialtyName}
					doctorName={doctorName}
					dateFormatted={dateFormatted}
					timeSlotFormatted={timeSlotFormatted}
					canConfirm={canConfirm}
					submitting={submitting}
					onConfirm={handleConfirm}
				/>
			</section>

			<AppointmentConflictModal
				open={conflictOpen}
				conflictedSlotInterval={conflictedSlotInterval}
				onClose={() => setConflictOpen(false)}
				onRefresh={fetchSchedules}
			/>
		</section>
	);
}
