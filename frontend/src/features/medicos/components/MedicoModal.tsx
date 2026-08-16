import {
	type FormEvent,
	type KeyboardEvent,
	useEffect,
	useRef,
	useState,
} from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useCreateMedico } from "../hooks/useCreateMedico";
import {
	type EspecialidadeResponse,
	type MedicoResponse,
	medicoCreateSchema,
} from "../types/medico.types";

interface MedicoModalProps {
	especialidades: EspecialidadeResponse[];
	isLoadingEspecialidades: boolean;
	especialidadesError: string | null;
	onClose: () => void;
	onCreated: (medico: MedicoResponse) => void;
}

interface FieldErrors {
	nome?: string;
	especialidades?: string;
}

export function MedicoModal({
	especialidades,
	isLoadingEspecialidades,
	especialidadesError,
	onClose,
	onCreated,
}: MedicoModalProps) {
	const [nome, setNome] = useState("");
	const [especialidadesId, setEspecialidadesId] = useState<string[]>([]);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const dialogRef = useRef<HTMLElement>(null);
	const nameInputRef = useRef<HTMLInputElement>(null);
	const firstEspecialidadeRef = useRef<HTMLInputElement>(null);
	const { createMedico, isLoading, error, clearError } = useCreateMedico();
	const hasNoEspecialidades =
		!isLoadingEspecialidades &&
		especialidadesError === null &&
		especialidades.length === 0;

	useEffect(() => {
		const previouslyFocusedElement =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;
		nameInputRef.current?.focus();

		return () => {
			if (previouslyFocusedElement?.isConnected) {
				previouslyFocusedElement.focus();
			}
		};
	}, []);

	const handleDialogKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (event.key === "Escape" && !isLoading) {
			event.preventDefault();
			onClose();
			return;
		}
		if (event.key !== "Tab") return;

		const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
			'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
		);
		if (!focusable || focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last?.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first?.focus();
		}
	};

	const toggleEspecialidade = (id: string, checked: boolean) => {
		setEspecialidadesId((current) =>
			checked ? [...current, id] : current.filter((item) => item !== id),
		);
		setFieldErrors((current) => ({ ...current, especialidades: undefined }));
		clearError();
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isLoading) return;

		const parsed = medicoCreateSchema.safeParse({
			nome,
			especialidades_id: especialidadesId,
		});
		if (!parsed.success) {
			const errors: FieldErrors = {};
			if (nome.trim().length === 0 || nome.trim().length > 255) {
				errors.nome = "Informe um nome com até 255 caracteres.";
			}
			if (especialidadesId.length === 0) {
				errors.especialidades = "Selecione ao menos uma especialidade.";
			}
			setFieldErrors(errors);
			if (errors.nome) {
				nameInputRef.current?.focus();
			} else if (errors.especialidades) {
				firstEspecialidadeRef.current?.focus();
			}
			return;
		}

		try {
			const medico = await createMedico(parsed.data);
			onCreated(medico);
			onClose();
		} catch {
			// Hook mantém mensagem e formulário preservado para correção e reenvio.
		}
	};

	return (
		<div className="modal-backdrop open">
			<section
				ref={dialogRef}
				className="modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="medico-modal-title"
				aria-describedby="medico-modal-description"
				onKeyDown={handleDialogKeyDown}
			>
				<header className="modal-head">
					<div>
						<h2 id="medico-modal-title">Novo médico</h2>
						<p id="medico-modal-description" className="breadcrumb">
							Informe nome e ao menos uma especialidade.
						</p>
					</div>
					<button
						type="button"
						className="modal-close"
						onClick={onClose}
						disabled={isLoading}
						aria-label="Fechar cadastro de médico"
					>
						×
					</button>
				</header>

				<form noValidate onSubmit={handleSubmit}>
					<div className="modal-body">
						<div className="field">
							<label className="required" htmlFor="medico-name">
								Nome
							</label>
							<input
								ref={nameInputRef}
								id="medico-name"
								className="input"
								name="nome"
								maxLength={255}
								required
								value={nome}
								onChange={(event) => {
									setNome(event.target.value);
									setFieldErrors((current) => ({
										...current,
										nome: undefined,
									}));
									clearError();
								}}
								aria-invalid={Boolean(fieldErrors.nome)}
								aria-describedby={
									fieldErrors.nome ? "medico-name-error" : undefined
								}
							/>
							{fieldErrors.nome && (
								<p id="medico-name-error" className="field-error">
									{fieldErrors.nome}
								</p>
							)}
						</div>

						{isLoadingEspecialidades ? (
							<p className="breadcrumb" role="status">
								Carregando especialidades...
							</p>
						) : especialidadesError ? (
							<div className="notice danger" role="alert">
								{especialidadesError} Feche o formulário e tente novamente.
							</div>
						) : hasNoEspecialidades ? (
							<div className="notice warning" role="status">
								<p>
									Cadastre uma especialidade antes de cadastrar um médico.{" "}
									<Link
										className="font-semibold underline"
										to="/especialidades"
									>
										Ir para especialidades
									</Link>
								</p>
							</div>
						) : (
							<fieldset
								className="m-0 border-0 p-0"
								aria-describedby={
									fieldErrors.especialidades
										? "medico-specialties-error"
										: "medico-specialties-help"
								}
							>
								<legend className="legend required">Especialidades</legend>
								<p id="medico-specialties-help" className="field-help mb-2">
									Selecione uma ou mais opções.
								</p>
								<div className="chips">
									{especialidades.map((especialidade, index) => (
										<label className="chip" key={especialidade.id}>
											<input
												ref={index === 0 ? firstEspecialidadeRef : undefined}
												type="checkbox"
												name="especialidades_id"
												value={especialidade.id}
												checked={especialidadesId.includes(especialidade.id)}
												aria-invalid={Boolean(fieldErrors.especialidades)}
												aria-describedby={
													fieldErrors.especialidades
														? "medico-specialties-error"
														: undefined
												}
												onChange={(event) =>
													toggleEspecialidade(
														especialidade.id,
														event.target.checked,
													)
												}
											/>
											{especialidade.nome}
										</label>
									))}
								</div>
								{fieldErrors.especialidades && (
									<p
										id="medico-specialties-error"
										className="field-error mt-2"
										role="alert"
									>
										{fieldErrors.especialidades}
									</p>
								)}
							</fieldset>
						)}
					</div>

					{error && (
						<p className="field-error mt-4" role="alert">
							{error}
						</p>
					)}

					<div className="modal-actions">
						<Button variant="secondary" onClick={onClose} disabled={isLoading}>
							Cancelar
						</Button>
						<Button
							type="submit"
							variant="primary"
							disabled={
								isLoading ||
								isLoadingEspecialidades ||
								Boolean(especialidadesError) ||
								hasNoEspecialidades
							}
							aria-busy={isLoading}
						>
							{isLoading ? "Salvando..." : "Salvar médico"}
						</Button>
					</div>
				</form>
			</section>
		</div>
	);
}
