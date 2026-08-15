import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ClienteResponse } from "@/api/generated";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/Error";
import { Skeleton } from "@/components/ui/Skeleton";

interface ClientSelectionCardProps {
	clients: ClienteResponse[];
	selectedClient: ClienteResponse | null;
	loading: boolean;
	error: string | null;
	onSelectClient: (client: ClienteResponse) => void;
	onRetry: () => void;
}

function formatDate(dateString: string): string {
	if (!dateString) return "";
	const [year, month, day] = dateString.split("-");
	if (year && month && day) {
		return `${day}/${month}/${year}`;
	}
	return dateString;
}

export function ClientSelectionCard({
	clients,
	selectedClient,
	loading,
	error,
	onSelectClient,
	onRetry,
}: ClientSelectionCardProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const hasSearch = searchQuery.trim().length > 0;

	const filteredClients = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return [];
		return clients.filter((client) => {
			const nameMatch = client.nome.toLowerCase().includes(query);
			const phoneMatch = client.telefone.toLowerCase().includes(query);
			const emailMatch = client.email
				? client.email.toLowerCase().includes(query)
				: false;
			return nameMatch || phoneMatch || emailMatch;
		});
	}, [clients, searchQuery]);

	return (
		<article className="card text-left" data-od-id="card-selecao-cliente">
			<div className="card-head">
				<div>
					<h2 className="card-title">1. Selecione o cliente</h2>
					<p>Pesquise por nome, telefone ou e-mail</p>
				</div>
				<Link className="btn btn-ghost btn-sm" to="/clientes/cadastro">
					Cadastrar novo
				</Link>
			</div>

			<div className="field">
				<label htmlFor="client-query">Buscar cliente</label>
				<input
					className="input"
					id="client-query"
					type="search"
					placeholder="Digite o nome, telefone ou e-mail..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			{loading && (
				<div
					className="mt-4 flex flex-col gap-2"
					role="status"
					aria-live="polite"
				>
					<Skeleton className="h-14 w-full" />
					<Skeleton className="h-14 w-full" />
				</div>
			)}

			{!loading && error && (
				<div className="mt-4">
					<ErrorState message={error} onRetry={onRetry} />
				</div>
			)}

			{!loading && !error && hasSearch && filteredClients.length > 0 && (
				<div
					className="select-list mt-4"
					id="client-options"
					role="listbox"
					aria-label="Lista de clientes encontrados"
				>
					{filteredClients.map((client) => {
						const isSelected = selectedClient?.id === client.id;
						return (
							<button
								key={client.id}
								type="button"
								role="option"
								aria-selected={isSelected}
								className={`select-item ${isSelected ? "selected" : ""}`}
								data-client={client.nome}
								onClick={() => onSelectClient(client)}
							>
								<span>
									<strong>{client.nome}</strong>
									<small>
										{client.telefone}
										{client.data_nascimento
											? ` · ${formatDate(client.data_nascimento)}`
											: ""}
										{client.email ? ` · ${client.email}` : ""}
									</small>
								</span>
								<span className="text-xs font-semibold text-primary">
									{isSelected ? "Selecionado" : "Selecionar"}
								</span>
							</button>
						);
					})}
				</div>
			)}

			{!loading && !error && hasSearch && filteredClients.length === 0 && (
				<div
					className="mt-4 rounded-xl border border-border p-5 text-center text-sm text-muted-foreground"
					role="status"
				>
					<p>Nenhum cliente encontrado para "{searchQuery}".</p>
					<Button
						variant="ghost"
						size="sm"
						className="mt-2"
						onClick={() => setSearchQuery("")}
					>
						Limpar busca
					</Button>
				</div>
			)}

			{!loading && !error && !hasSearch && selectedClient && (
				<div
					className="select-list mt-4"
					id="client-options"
					role="listbox"
					aria-label="Cliente selecionado"
				>
					<button
						type="button"
						role="option"
						aria-selected="true"
						className="select-item selected"
						data-client={selectedClient.nome}
						onClick={() => onSelectClient(selectedClient)}
					>
						<span>
							<strong>{selectedClient.nome}</strong>
							<small>
								{selectedClient.telefone}
								{selectedClient.data_nascimento
									? ` · ${formatDate(selectedClient.data_nascimento)}`
									: ""}
								{selectedClient.email ? ` · ${selectedClient.email}` : ""}
							</small>
						</span>
						<span className="text-xs font-semibold text-primary">
							Cliente selecionado
						</span>
					</button>
				</div>
			)}

			{!loading && !error && !hasSearch && !selectedClient && (
				<div
					className="mt-4 rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground"
					role="status"
				>
					<p className="font-medium text-foreground">
						Pesquise para selecionar um cliente
					</p>
					<p className="mt-1">
						Digite o nome, telefone ou e-mail no campo acima para localizar o
						cadastro.
					</p>
				</div>
			)}
		</article>
	);
}
