import { Button } from "@/components/ui/Button";

interface MedicosHeaderProps {
	onCadastrar: () => void;
}

export function MedicosHeader({ onCadastrar }: MedicosHeaderProps) {
	return (
		<header className="page-head">
			<div>
				<h1>Médicos</h1>
				<p>Consulte médicos cadastrados e suas especialidades.</p>
			</div>
			<Button variant="primary" onClick={onCadastrar}>
				Cadastrar médico
			</Button>
		</header>
	);
}
