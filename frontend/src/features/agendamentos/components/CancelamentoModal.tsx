import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type {
	Appointment,
	CancelamentoOrigem,
	CancelamentoPayload,
} from "../api/types";

interface CancelamentoModalProps {
	open: boolean;
	agendamento: Appointment | null;
	onConfirm: (payload: CancelamentoPayload) => void;
	onClose: () => void;
}

const ORIGENS: ReadonlyArray<{
	value: CancelamentoOrigem;
	titulo: string;
	descricao: string;
}> = [
	{
		value: "CLIENTE",
		titulo: "Solicitação do cliente",
		descricao: "O horário permanece ativo e volta a ficar disponível.",
	},
	{
		value: "MEDICO",
		titulo: "Indisponibilidade do médico",
		descricao: "O horário é desativado e não volta à disponibilidade.",
	},
];

export function CancelamentoModal({
	open,
	agendamento,
	onConfirm,
	onClose,
}: CancelamentoModalProps) {
	const [origem, setOrigem] = useState<CancelamentoOrigem | null>(null);
	const [observacao, setObservacao] = useState("");
	const primeiroRadioRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (open) {
			setOrigem(null);
			setObservacao("");
			primeiroRadioRef.current?.focus();
		}
	}, [open]);

	if (!open) return null;

	const handleConfirm = () => {
		if (origem === null) return;
		const observacaoTrim = observacao.trim();
		onConfirm({
			origem,
			observacao: observacaoTrim === "" ? undefined : observacaoTrim,
		});
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

	return (
		<div
			className="modal-backdrop open"
			onClick={handleBackdropClick}
			onKeyDown={handleBackdropKeyDown}
			role="dialog"
			aria-modal="true"
			aria-labelledby="cancel-title"
		>
			<div className="modal">
				<div className="modal-head">
					<div>
						<h2 id="cancel-title">Cancelar agendamento</h2>
						<p className="breadcrumb">
							Informe a origem para definir o destino do horário.
						</p>
						{agendamento && (
							<p className="breadcrumb">
								{agendamento.cliente} · {agendamento.data} {agendamento.horario}
							</p>
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
					<fieldset className="legend">
						<legend className="legend">Origem do cancelamento</legend>
						<div
							style={{ display: "grid", gap: "8px" }}
							ref={primeiroRadioRef}
							tabIndex={-1}
						>
							{ORIGENS.map((op) => {
								const selected = origem === op.value;
								return (
									<label
										key={op.value}
										className={`select-item${selected ? " selected" : ""}`}
									>
										<span>
											<strong>{op.titulo}</strong>
											<small>{op.descricao}</small>
										</span>
										<input
											type="radio"
											name="cancel-origin"
											value={op.value}
											checked={selected}
											onChange={() => setOrigem(op.value)}
											aria-label={op.titulo}
										/>
									</label>
								);
							})}
						</div>
					</fieldset>

					<div className="field">
						<label htmlFor="cancel-note">Observação opcional</label>
						<textarea
							id="cancel-note"
							className="textarea"
							placeholder="Registre um contexto breve, se necessário"
							value={observacao}
							onChange={(e) => setObservacao(e.target.value)}
						/>
					</div>
				</div>

				<div className="modal-actions">
					<Button variant="secondary" onClick={onClose}>
						Manter agendamento
					</Button>
					<Button
						variant="danger"
						disabled={origem === null}
						onClick={handleConfirm}
					>
						Confirmar cancelamento
					</Button>
				</div>
			</div>
		</div>
	);
}
