import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import type { HorarioDisponivelResponse } from "@/api/generated";

interface DesativarHorarioModalProps {
	open: boolean;
	horario: HorarioDisponivelResponse | null;
	onConfirm: () => void;
	onClose: () => void;
	submitting?: boolean;
	error?: string;
}

function formatDate(value: string) {
	return new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(value));
}

function formatTime(value: string) {
	return new Intl.DateTimeFormat("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
		timeZone: "UTC",
	}).format(new Date(value));
}

export function DesativarHorarioModal({
	open,
	horario,
	onConfirm,
	onClose,
	submitting = false,
	error,
}: DesativarHorarioModalProps) {
	const primeiroBotaoRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (open) {
			primeiroBotaoRef.current?.focus();
		}
	}, [open]);

	if (!open) return null;

	const handleConfirm = () => {
		if (submitting) return;
		onConfirm();
	};

	const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	const handleBackdropKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Escape") {
			onClose();
		}
	};

	const horarioTexto = horario
		? `${horario.medico.nome} · ${formatDate(horario.inicio)} ${formatTime(horario.inicio)}–${formatTime(horario.fim)}`
		: "";

	return (
		<div
			className="modal-backdrop open"
			onClick={handleBackdropClick}
			onKeyDown={handleBackdropKeyDown}
			role="dialog"
			aria-modal="true"
			aria-labelledby="deactivate-title"
		>
			<div className="modal">
				<div className="modal-head">
					<div>
						<h2 id="deactivate-title">Desativar horário?</h2>
						<p className="breadcrumb">
							O bloco deixará de aceitar novos agendamentos.
						</p>
						{horario && (
							<p className="breadcrumb">{horarioTexto}</p>
						)}
					</div>
					<button
						type="button"
						className="modal-close"
						aria-label="Fechar"
						onClick={onClose}
					>
						×
					</button>
				</div>

				<div className="modal-body">
					{error && (
						<div className="field-error" style={{ marginBottom: "12px" }}>
							{error}
						</div>
					)}
					<div className="notice">
						<div>
							<strong>Verificação de vínculo</strong>
							<p>
								Este horário não possui agendamento ativo. Se possuísse, o
								cancelamento deveria ocorrer primeiro.
							</p>
						</div>
					</div>
				</div>

				<div className="modal-actions">
					<Button
						ref={primeiroBotaoRef}
						variant="secondary"
						onClick={onClose}
						disabled={submitting}
					>
						Manter ativo
					</Button>
					<Button
						variant="danger"
						disabled={submitting}
						onClick={handleConfirm}
					>
						{submitting ? "Desativando..." : "Desativar horário"}
					</Button>
				</div>
			</div>
		</div>
	);
}