import { Button } from "@/components/ui/Button";

interface EspecialiadeHeaderProps{
	onClick: React.Dispatch<React.SetStateAction<boolean>>
}

export function EspecialidadesHeader({ onClick }: EspecialiadeHeaderProps) {
	return (
		<header className="page-head">
			<div>
				<h1>Especialidades</h1>
				<p>Consulte Especialidades cadastradas.</p>
			</div>
			<Button
				variant="primary"
				onClick={() => {onClick(true)}} //modal de cadastro
			>
				Cadastrar Especialidade
			</Button>
		</header>
	);
}
