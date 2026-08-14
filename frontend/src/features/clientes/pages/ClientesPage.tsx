import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buttonVariants } from "@/components/ui/Button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/Empty";
import { ErrorState } from "@/components/ui/Error";
import { ClienteSkeleton } from "../components/ClienteSkeleton";
import { ClienteTable } from "../components/ClienteTable";
import { useListClient } from "../hook/useListClient.hook";

export function ClientesPage() {
	const { clientes, isLoading, error, fetchClientes } = useListClient();
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
			) : error ? (
				<ErrorState message={error} onRetry={() => void fetchClientes()} />
			) : clientes.length === 0 ? (
				<Empty className="border border-border bg-card py-16">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Users aria-hidden="true" />
						</EmptyMedia>
						<EmptyTitle>Nenhum cliente cadastrado</EmptyTitle>
						<EmptyDescription>
							Cadastre primeiro cliente para começar.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<button
							type="button"
							onClick={() => navigate("/clientes/cadastro")}
							className={buttonVariants({ variant: "primary" })}
						>
							Cadastrar cliente
						</button>
					</EmptyContent>
				</Empty>
			) : (
				<ClienteTable clientes={clientes} />
			)}
		</section>
	);
}
