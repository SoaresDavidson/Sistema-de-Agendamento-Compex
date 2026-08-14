import {
	type ChangeEvent,
	type FormEvent,
	useEffect,
	useRef,
	useState,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "@/api/api";
import { Button } from "@/components/ui/Button";
import { useCreateClient } from "../hook/useClientCreate.hook";
import { useUpdateClient } from "../hook/useClientPatch.hook";
import {
	type ClienteCreate,
	type ClienteResponse,
	clienteCreateSchema,
} from "../types/cliente.types";

export function ClientCadastro() {
	const { id } = useParams();
	const location = useLocation();
	const cliente = (location.state as { cliente?: ClienteResponse } | null)
		?.cliente;
	const isEditing = Boolean(id);
	const navigate = useNavigate();
	const [duplicatePayload, setDuplicatePayload] =
		useState<ClienteCreate | null>(null);
	const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
	const [error, setError] = useState<string | null>(null);
	const submissionLock = useRef(false);
	const declineDuplicateButtonRef = useRef<HTMLButtonElement>(null);
	const { createClient, isLoading: isCreating } = useCreateClient();

	const { updateClient, isLoading: isUpdating } = useUpdateClient();
	const isSubmitting = isCreating || isUpdating;

	useEffect(() => {
		if (duplicatePayload) declineDuplicateButtonRef.current?.focus();
	}, [duplicatePayload]);

	const submitPayload = async (payload: ClienteCreate) => {
		if (submissionLock.current) return;
		submissionLock.current = true;
		setError(null);
		try {
			if (isEditing && id) {
				await updateClient(id, payload);
			} else {
				await createClient(payload);
			}
			navigate("/clientes", {
				state: {
					clientSaved: isEditing ? "updated" : "created",
				},
			});
		} catch (caughtError) {
			if (
				caughtError instanceof ApiError &&
				caughtError.status === 409 &&
				!payload.confirmar_duplicidade
			) {
				setDuplicatePayload({ ...payload, confirmar_duplicidade: true });
			} else {
				setError(
					"Não foi possível salvar o cliente. Revise os dados e tente novamente.",
				);
			}
		} finally {
			submissionLock.current = false;
		}
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (submissionLock.current) return;

		const formElement = event.currentTarget;
		const values = readFormValues(new FormData(formElement));
		const errors = validateForm(values);
		setFieldErrors(errors);
		setError(null);
		setDuplicatePayload(null);

		const firstInvalidField = fieldNames.find((field) => errors[field]);
		if (firstInvalidField) {
			const input = formElement.elements.namedItem(firstInvalidField);
			if (input instanceof HTMLElement) input.focus();
			return;
		}

		void submitPayload({
			...values,
			email: values.email || null,
			data_nascimento: brazilianDateToIso(values.data_nascimento) ?? "",
			confirmar_duplicidade: false,
		});
	};

	const handleFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
		const field = event.currentTarget.name;
		if (!isFieldName(field)) return;
		setFieldErrors((current) => ({ ...current, [field]: undefined }));
		setDuplicatePayload(null);
		setError(null);
	};

	const handleCancel = () => navigate("/clientes");
	const handleConfirmDuplicate = () => {
		if (duplicatePayload) void submitPayload(duplicatePayload);
	};

	return (
		<section className="min-w-0">
			<header className="page-head">
				<div>
					<h1>{isEditing ? "Editar cliente" : "Cadastrar cliente"}</h1>
					<p>
						Nome, telefone e data de nascimento são obrigatórios. E-mail é
						opcional.
					</p>
				</div>
				<Button
					variant="secondary"
					onClick={handleCancel}
					disabled={isSubmitting}
				>
					Voltar para clientes
				</Button>
			</header>

			<form
				noValidate
				className="table-wrap max-w-3xl space-y-5 p-6"
				onSubmit={handleSubmit}
			>
				<fieldset disabled={isSubmitting} className="space-y-5">
					<div className="field">
						<label htmlFor="client-name">
							Nome completo <span className="text-destructive">*</span>
						</label>
						<input
							id="client-name"
							className="input"
							name="nome"
							defaultValue={cliente?.nome ?? ""}
							maxLength={255}
							required
							onChange={handleFieldChange}
							aria-invalid={Boolean(fieldErrors.nome)}
							aria-describedby={
								fieldErrors.nome ? "client-name-error" : undefined
							}
						/>
						{fieldErrors.nome && (
							<p id="client-name-error" className="field-error">
								{fieldErrors.nome}
							</p>
						)}
					</div>

					<div className="grid gap-5 md:grid-cols-2">
						<div className="field">
							<label htmlFor="client-phone">
								Telefone <span className="text-destructive">*</span>
							</label>
							<input
								id="client-phone"
								className="input"
								name="telefone"
								defaultValue={cliente?.telefone ?? ""}
								type="tel"
								placeholder="(85) 98841-2030"
								maxLength={255}
								required
								onChange={handleFieldChange}
								aria-invalid={Boolean(fieldErrors.telefone)}
								aria-describedby={
									fieldErrors.telefone ? "client-phone-error" : undefined
								}
							/>
							{fieldErrors.telefone && (
								<p id="client-phone-error" className="field-error">
									{fieldErrors.telefone}
								</p>
							)}
						</div>

						<div className="field">
							<label htmlFor="client-email">E-mail opcional</label>
							<input
								id="client-email"
								className="input"
								name="email"
								defaultValue={cliente?.email ?? ""}
								type="email"
								placeholder="nome@email.com"
								onChange={handleFieldChange}
								aria-invalid={Boolean(fieldErrors.email)}
								aria-describedby={
									fieldErrors.email ? "client-email-error" : undefined
								}
							/>
							{fieldErrors.email && (
								<p id="client-email-error" className="field-error">
									{fieldErrors.email}
								</p>
							)}
						</div>
					</div>

					<div className="field max-w-sm">
						<label htmlFor="client-birth-date">
							Data de nascimento (DD/MM/AAAA){" "}
							<span className="text-destructive">*</span>
						</label>
						<input
							id="client-birth-date"
							className="input"
							name="data_nascimento"
							defaultValue={isoDateToBrazilian(cliente?.data_nascimento ?? "")}
							type="text"
							inputMode="numeric"
							placeholder="DD/MM/AAAA"
							maxLength={10}
							autoComplete="bday"
							required
							onChange={handleFieldChange}
							aria-invalid={Boolean(fieldErrors.data_nascimento)}
							aria-describedby={
								fieldErrors.data_nascimento
									? "client-birth-date-error"
									: undefined
							}
						/>
						{fieldErrors.data_nascimento && (
							<p id="client-birth-date-error" className="field-error">
								{fieldErrors.data_nascimento}
							</p>
						)}
					</div>
				</fieldset>

				{duplicatePayload && (
					<div
						className="rounded-control border border-destructive/30 bg-destructive/5 p-4"
						role="alert"
						aria-labelledby="duplicate-title"
					>
						<strong id="duplicate-title" className="block">
							Possível cliente duplicado
						</strong>
						<p className="mt-1 text-sm text-muted-foreground">
							Já existe um cliente com mesmo nome e data de nascimento. Compare
							os dados antes de continuar.
						</p>
						<div className="mt-4 flex flex-wrap gap-3">
							<Button
								ref={declineDuplicateButtonRef}
								variant="secondary"
								onClick={handleCancel}
								disabled={isSubmitting}
							>
								Não prosseguir
							</Button>
							<Button onClick={handleConfirmDuplicate} disabled={isSubmitting}>
								{isSubmitting ? "Salvando..." : "Prosseguir mesmo assim"}
							</Button>
						</div>
					</div>
				)}

				{error && (
					<p className="field-error" role="alert">
						{error}
					</p>
				)}

				<div className="flex justify-end gap-3 border-t border-border pt-5">
					<Button
						variant="secondary"
						onClick={handleCancel}
						disabled={isSubmitting}
					>
						Cancelar
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting || Boolean(duplicatePayload)}
					>
						{isSubmitting ? "Salvando..." : "Salvar cliente"}
					</Button>
				</div>
			</form>
		</section>
	);
}

const fieldNames = ["nome", "telefone", "email", "data_nascimento"] as const;
type FieldName = (typeof fieldNames)[number];
type FormErrors = Partial<Record<FieldName, string>>;

interface FormValues {
	nome: string;
	telefone: string;
	email: string;
	data_nascimento: string;
}

function isFieldName(value: string): value is FieldName {
	return fieldNames.some((field) => field === value);
}

function readFormValues(form: FormData): FormValues {
	return {
		nome: String(form.get("nome") ?? "").trim(),
		telefone: String(form.get("telefone") ?? "").trim(),
		email: String(form.get("email") ?? "").trim(),
		data_nascimento: String(form.get("data_nascimento") ?? ""),
	};
}

function validateForm(values: FormValues): FormErrors {
	const errors: FormErrors = {};
	const birthDate = brazilianDateToIso(values.data_nascimento);
	if (!values.nome) errors.nome = "Informe nome completo.";
	else if (values.nome.length > 255) {
		errors.nome = "Nome deve ter no máximo 255 caracteres.";
	}
	if (!values.telefone) errors.telefone = "Informe telefone.";
	else if (values.telefone.length > 255) {
		errors.telefone = "Telefone deve ter no máximo 255 caracteres.";
	}
	if (
		values.email &&
		!clienteCreateSchema.shape.email.safeParse(values.email).success
	) {
		errors.email = "Informe e-mail válido.";
	}
	if (!values.data_nascimento) {
		errors.data_nascimento = "Informe data de nascimento.";
	} else if (!birthDate) {
		errors.data_nascimento = "Informe data de nascimento válida.";
	} else if (birthDate > getToday()) {
		errors.data_nascimento = "Data de nascimento não pode estar no futuro.";
	}
	return errors;
}

function brazilianDateToIso(value: string): string | null {
	const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
	if (!match) return null;

	const day = Number(match[1]);
	const month = Number(match[2]);
	const year = Number(match[3]);
	if (year < 1) return null;

	const date = new Date(0);
	date.setUTCFullYear(year, month - 1, day);
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null;
	}

	return date.toISOString().slice(0, 10);
}

function isoDateToBrazilian(value: string): string {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
	return value.split("-").reverse().join("/");
}

function getToday(): string {
	return new Date().toISOString().slice(0, 10);
}
