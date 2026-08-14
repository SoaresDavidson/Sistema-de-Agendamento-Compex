import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "@/api/api";
import { Button } from "@/components/ui/Button";
import { clienteService } from "../services/clientes.service";

export function ClientCadastro() {
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [duplicate, setDuplicate] = useState(false);
	const [confirmDuplicate, setConfirmDuplicate] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsSubmitting(true);
		setError(null);

		const form = new FormData(event.currentTarget);
		const nome = String(form.get("nome") ?? "").trim();
		const telefone = String(form.get("telefone") ?? "").trim();
		const email = String(form.get("email") ?? "").trim();
		const dataNascimento = String(form.get("data_nascimento") ?? "");

		try {
			await clienteService.createClient({
				nome,
				telefone,
				email: email || null,
				data_nascimento: dataNascimento,
				confirmar_duplicidade: confirmDuplicate,
			});
			navigate("/clientes");
		} catch (caughtError) {
			if (caughtError instanceof ApiError && caughtError.status === 409) {
				setDuplicate(true);
				setConfirmDuplicate(false);
			} else {
				setError(
					"Não foi possível salvar o cliente. Revise os dados e tente novamente.",
				);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section className="min-w-0">
			<header className="page-head">
				<div>
					<h1>Cadastrar cliente</h1>
					<p>
						Nome, telefone e data de nascimento são obrigatórios. E-mail é
						opcional.
					</p>
				</div>
				<Button variant="secondary" onClick={() => navigate("/clientes")}>
					Voltar para clientes
				</Button>
			</header>

			<form
				noValidate
				className="table-wrap max-w-3xl space-y-5 p-6"
				onSubmit={handleSubmit}
			>
				<div className="field">
					<label htmlFor="client-name">
						Nome completo <span className="text-destructive">*</span>
					</label>
					<input
						id="client-name"
						className="input"
						name="nome"
						required
						formNoValidate
					/>
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
							type="tel"
							placeholder="(85) 98841-2030"
							required
							formNoValidate
						/>
					</div>

					<div className="field">
						<label htmlFor="client-email">E-mail opcional</label>
						<input
							id="client-email"
							className="input"
							name="email"
							type="email"
							placeholder="nome@email.com"
						/>
					</div>
				</div>

				<div className="field max-w-sm">
					<label htmlFor="client-birth-date">
						Data de nascimento <span className="text-destructive">*</span>
					</label>
					<input
						id="client-birth-date"
						className="input"
						name="data_nascimento"
						type="date"
						required
					/>
				</div>

				{duplicate && (
					<div
						className="rounded-control border border-destructive/30 bg-destructive/5 p-4"
						role="alert"
					>
						<strong className="block">Possível cliente duplicado</strong>
						<p className="mt-1 text-sm text-muted-foreground">
							Já existe um cliente com mesmo nome e data de nascimento. Compare
							os dados antes de continuar.
						</p>
						<label className="mt-3 flex items-center gap-3">
							<input
								type="checkbox"
								checked={confirmDuplicate}
								onChange={(event) => setConfirmDuplicate(event.target.checked)}
							/>
							Revisei os dados e quero cadastrar mesmo assim
						</label>
					</div>
				)}

				{error && (
					<p className="field-error" role="alert">
						{error}
					</p>
				)}

				<div className="flex justify-end gap-3 border-t border-border pt-5">
					<Button variant="secondary" onClick={() => navigate("/clientes")}>
						Cancelar
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting || (duplicate && !confirmDuplicate)}
					>
						{isSubmitting ? "Salvando..." : "Salvar cliente"}
					</Button>
				</div>
			</form>
		</section>
	);
}
