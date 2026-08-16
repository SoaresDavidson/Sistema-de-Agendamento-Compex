import { useEffect, useState } from "react";
import { medicosService } from "@/features/medicos/services/medicos.service";

const LIMITE_MAXIMO = 100;

interface FilterOptions {
	medicos: string[];
	especialidades: string[];
	loading: boolean;
}

async function listarNomesMedicos(): Promise<string[]> {
	const nomes = new Set<string>();
	const cursors = new Set<string>();
	let cursor: string | null = null;

	do {
		const page = await medicosService.list(
			{ nome: "", especialidadeId: "" },
			cursor,
			LIMITE_MAXIMO,
		);
		for (const medico of page.items) nomes.add(medico.nome);
		cursor = page.next_cursor;
		if (cursor) {
			if (cursors.has(cursor)) break;
			cursors.add(cursor);
		}
	} while (cursor);

	return [...nomes].sort((a, b) => a.localeCompare(b));
}

async function listarNomesEspecialidades(): Promise<string[]> {
	const especialidades = await medicosService.listEspecialidades();
	return especialidades
		.map((especialidade) => especialidade.nome)
		.sort((a, b) => a.localeCompare(b));
}

export function useFilterOptions(): FilterOptions {
	const [medicos, setMedicos] = useState<string[]>([]);
	const [especialidades, setEspecialidades] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let ativo = true;
		setLoading(true);
		void Promise.all([listarNomesMedicos(), listarNomesEspecialidades()])
			.then(([nomesMedicos, nomesEspecialidades]) => {
				if (!ativo) return;
				setMedicos(nomesMedicos);
				setEspecialidades(nomesEspecialidades);
			})
			.catch(() => {
				if (!ativo) return;
				setMedicos([]);
				setEspecialidades([]);
			})
			.finally(() => {
				if (ativo) setLoading(false);
			});
		return () => {
			ativo = false;
		};
	}, []);

	return { medicos, especialidades, loading };
}
