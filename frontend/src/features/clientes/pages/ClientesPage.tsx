import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buttonVariants } from "@/components/ui/Button";
import { ClienteSkeleton } from "../components/ClienteSkeleton";
import { ClienteTable } from "../components/ClienteTable";
import { useListClient } from "../hook/useListClient.hook";

export function ClientesPage() {
	const { clientes, isLoading, fetchClientes } = useListClient();
	const [hasLoaded, setHasLoaded] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		let isActive = true;

		void fetchClientes().finally(() => {
			if (isActive) setHasLoaded(true);
		});

		return () => {
			isActive = false;
		};
	}, [fetchClientes]);

	return (
		<section className="min-w-0">
			<header className="page-head">
				<div>
					<h1>Clientes</h1>
					<p>
						Consulte os dados de contato e edite o cadastro quando necessário.
					</p>
				</div>
				<button
					type="button"
					onClick={() => {
						navigate("/clientes/cadastro");
					}}
					className={buttonVariants({
						variant: "primary",
					})}
				>
					Cadastrar Cliente
				</button>
			</header>

			{!hasLoaded || isLoading ? (
				<ClienteSkeleton />
			) : clientes.length === 0 ? (
				<p role="status" aria-live="polite">
					Nenhum cliente encontrado
				</p>
			) : (
				<ClienteTable clientes={clientes} />
			)}
		</section>
	);
}
