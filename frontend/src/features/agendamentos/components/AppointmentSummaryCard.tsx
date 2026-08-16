import { Button } from "@/components/ui/Button";

interface AppointmentSummaryCardProps {
	clientName: string | null;
	specialtyName: string | null;
	doctorName: string | null;
	dateFormatted: string | null;
	timeSlotFormatted: string | null;
	canConfirm: boolean;
	submitting: boolean;
	onConfirm: () => void;
}

export function AppointmentSummaryCard({
	clientName,
	specialtyName,
	doctorName,
	dateFormatted,
	timeSlotFormatted,
	canConfirm,
	submitting,
	onConfirm,
}: AppointmentSummaryCardProps) {
	return (
		<aside
			className="card sticky top-24 text-left"
			data-od-id="agendamento-resumo"
			aria-label="Revisão do agendamento"
		>
			<div className="card-head">
				<div>
					<h2 className="card-title">Revisão</h2>
					<p>Confira antes de confirmar</p>
				</div>
			</div>

			<div className="summary-list">
				<div className="summary-row">
					<span>Cliente</span>
					<strong id="summary-client">{clientName || "—"}</strong>
				</div>
				<div className="summary-row">
					<span>Especialidade</span>
					<strong id="summary-specialty">{specialtyName || "—"}</strong>
				</div>
				<div className="summary-row">
					<span>Médico</span>
					<strong id="summary-doctor">{doctorName || "—"}</strong>
				</div>
				<div className="summary-row">
					<span>Data</span>
					<strong id="summary-date">{dateFormatted || "—"}</strong>
				</div>
				<div className="summary-row">
					<span>Início e fim</span>
					<strong id="summary-time">{timeSlotFormatted || "—"}</strong>
				</div>
			</div>

			<div className="notice mt-4">
				<div>
					<strong>Verificação final obrigatória</strong>
					<p>
						Um horário pode deixar de estar disponível enquanto esta tela está
						aberta.
					</p>
				</div>
			</div>

			<Button
				id="confirm-appointment"
				className="mt-4 w-full"
				disabled={!canConfirm || submitting}
				onClick={onConfirm}
				aria-busy={submitting}
			>
				{submitting ? "Confirmando agendamento..." : "Confirmar agendamento"}
			</Button>
		</aside>
	);
}
