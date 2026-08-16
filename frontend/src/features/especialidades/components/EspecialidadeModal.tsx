import { type SubmitEvent, useRef, useState } from "react";
import { useCreateEspecialidade } from "../hook/useCreateEspecialidade.hook";
import { usePatchEspecialidade } from "../hook/usePatchEspecialidade.hook";
import { especialidadeCreateSchema } from "../types/especialidade.types";

interface EspecialidadeModalProps {
	especialidadeId: string;
	onClose: () => void;
	onSaved: () => Promise<void>;
}

export function EspecialidadeModal({
	especialidadeId,
	onClose,
	onSaved,
}: EspecialidadeModalProps) {
	const {
		createEspecialidade,
		isLoading: isCreating,
		error: createError,
	} = useCreateEspecialidade();
	const {
		patchEspecialidade,
		isLoading: isUpdating,
		error: patchError,
	} = usePatchEspecialidade();
	const isLoading = isCreating || isUpdating;
	const error = createError || patchError;
	const [fieldError, setFieldError] = useState<string | null>(null);
	const submissionLock = useRef(false);

	const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (submissionLock.current) return;

		const formElement = event.currentTarget;
		const payload = especialidadeCreateSchema.safeParse({
			nome: String(new FormData(formElement).get("nome") ?? ""),
		});
		setFieldError(null);

		if (!payload.success) {
			setFieldError("Informe nome com no máximo 255 caracteres.");
			const input = formElement.elements.namedItem("nome");
			if (input instanceof HTMLElement) input.focus();
			return;
		}

		submissionLock.current = true;
		const request = especialidadeId
			? patchEspecialidade(especialidadeId, payload.data)
			: createEspecialidade(payload.data);
		void request
			.then(onSaved)
			.then(onClose)
			.catch(() => undefined)
			.finally(() => {
				submissionLock.current = false;
			});
	};
	return (
		<div className="modal-backdrop open">
			<section className="modal">
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
					>
						×
					</button>
				</header>

				<form noValidate onSubmit={handleSubmit}>
					<div className="modal-body">
						<div className="field">
							<label className="required" htmlFor="especialidade-name">
								Nome
							</label>
							<input
								id="especialidade-name"
								className="input"
								name="nome"
								maxLength={255}
								required
								onChange={() => setFieldError(null)}
							/>
							{fieldError && (
								<p id="especialidade-name-error" className="field-error">
									{fieldError}
								</p>
							)}
						</div>
					</div>

					{error && (
						<p className="field-error" role="alert">
							Não foi possível salvar a especialidade. Tente novamente.
						</p>
					)}

					<div className="modal-actions">
						<button
							type="button"
							className="btn btn-secondary"
							onClick={onClose}
							disabled={isLoading}
						>
							Cancelar
						</button>
						<button
							type="submit"
							className="btn btn-primary"
							disabled={isLoading}
						>
							{isLoading ? "Salvando..." : "Salvar"}
						</button>
					</div>
				</form>
			</section>
		</div>
	);
}
