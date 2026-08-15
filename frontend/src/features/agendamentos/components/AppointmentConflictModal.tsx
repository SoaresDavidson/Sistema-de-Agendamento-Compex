import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

interface AppointmentConflictModalProps {
	open: boolean;
	conflictedSlotInterval?: string | null;
	onClose: () => void;
	onRefresh: () => void;
}

export function AppointmentConflictModal({
	open,
	conflictedSlotInterval,
	onClose,
	onRefresh,
}: AppointmentConflictModalProps) {
	const refreshBtnRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (open) {
			refreshBtnRef.current?.focus();
		}
	}, [open]);

	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, onClose]);

	const handleBackdropKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Escape") {
			onClose();
		}
	};

	if (!open) return null;

	return (
		<div
			className="modal-backdrop open"
			id="conflict-modal"
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="conflict-title"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
			onKeyDown={handleBackdropKeyDown}
		>
			<div className="modal text-left">
				<div className="modal-head">
					<div>
						<h2 id="conflict-title" className="text-xl font-bold">
							Horário não está mais disponível
						</h2>
						<p className="breadcrumb text-sm text-muted-foreground">
							Outro agendamento ocupou o bloco antes da confirmação.
						</p>
					</div>
					<button
						type="button"
						className="modal-close"
						onClick={onClose}
						aria-label="Fechar modal de conflito"
					>
						×
					</button>
				</div>

				<div className="notice danger">
					<div>
						<strong>
							{conflictedSlotInterval
								? `Conflito em ${conflictedSlotInterval}`
								: "Conflito de horário"}
						</strong>
						<p>
							Nenhum agendamento foi criado. Atualize a lista e escolha outro
							bloco disponível.
						</p>
					</div>
				</div>

				<div className="modal-actions">
					<Button variant="secondary" onClick={onClose}>
						Fechar
					</Button>
					<Button
						ref={refreshBtnRef}
						id="refresh-slots"
						onClick={() => {
							onRefresh();
							onClose();
						}}
					>
						Atualizar horários
					</Button>
				</div>
			</div>
		</div>
	);
}
