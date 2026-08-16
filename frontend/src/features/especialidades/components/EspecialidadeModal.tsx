interface EspecialidadeModalProps {
	especialidadeId: string;
	onClose: () => void;
}

export function EspecialidadeModal({
	especialidadeId,
	onClose,
}: EspecialidadeModalProps) {
	return (
		<div className="modal-backdrop open">
			<section
				className="modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="especialidade-modal-title"
			>
				<header className="modal-head">
					<div>
						<h2 id="especialidade-modal-title">
							{especialidadeId ? "Editar especialidade" : "Nova especialidade"}
						</h2>
						<p className="breadcrumb">
							O nome não pode repetir outro cadastro
						</p>
					</div>
					<button
						type="button"
						className="modal-close"
						onClick={onClose}
						aria-label="Fechar modal"
					>
						×
					</button>
				</header>

				<form noValidate>
					<div className="modal-body">
						<div className="field">
							<label className="required" htmlFor="especialidade-name">
								Nome
							</label>
							<input
								id="especialidade-name"
								className="input"
								name="especialidade"
								maxLength={255}
								required
							/>
						</div>
					</div>

					<div className="modal-actions">
						<button type="button" className="btn btn-secondary" onClick={onClose}>
							Cancelar
						</button>
						<button type="submit" className="btn btn-primary">
							Salvar
						</button>
					</div>
				</form>
			</section>
		</div>
	);
}
