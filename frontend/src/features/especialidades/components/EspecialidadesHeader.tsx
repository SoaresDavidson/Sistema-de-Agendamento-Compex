import { Button } from "@/components/ui/Button";

export function EspecialidadesHeader() {
	return (
		<header className="page-head">
			<div>
				<h1>Especialidades</h1>
				<p>Consulte Especialidades cadastradas.</p>
			</div>
			<Button
				variant="primary"
				onClick={() => {}} //modal de cadastro
			>
				Cadastrar Especialidade
			</Button>
		</header>
	);
}
