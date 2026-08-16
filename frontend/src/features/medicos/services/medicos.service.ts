import { z } from "zod";
import { apiRequest } from "@/api/api";
import { EspecialidadePage } from "@/api/generated";
import {
	type EspecialidadeResponse,
	type MedicoCreate,
	type MedicoFilters,
	type MedicoPage,
	type MedicoResponse,
	medicoCreateSchema,
	medicoPageSchema,
	medicoResponseSchema,
} from "../types/medico.types";

const limiteSchema = z.number().int().min(1).max(100);

export const medicosService = {
	async list(
		filters: MedicoFilters,
		cursor: string | null,
		limite = 20,
		signal?: AbortSignal,
	): Promise<MedicoPage> {
		const query = new URLSearchParams({
			limite: String(limiteSchema.parse(limite)),
		});
		const nome = filters.nome.trim();
		if (nome) query.set("nome", nome);
		if (filters.especialidadeId) {
			query.set("especialidade_id", filters.especialidadeId);
		}
		if (cursor) query.set("cursor", cursor);

		const response = await apiRequest<unknown>(`/medicos?${query.toString()}`, {
			method: "GET",
			signal,
		});
		return medicoPageSchema.parse(response);
	},

	async create(
		payload: MedicoCreate,
		signal?: AbortSignal,
	): Promise<MedicoResponse> {
		const validPayload = medicoCreateSchema.parse(payload);
		const response = await apiRequest<unknown>("/medicos", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validPayload),
			signal,
		});
		return medicoResponseSchema.parse(response);
	},

	async listEspecialidades(
		signal?: AbortSignal,
	): Promise<EspecialidadeResponse[]> {
		const especialidades: EspecialidadeResponse[] = [];
		const cursors = new Set<string>();
		let cursor: string | null = null;

		do {
			const query = new URLSearchParams({ limite: "100" });
			if (cursor) query.set("cursor", cursor);
			const response = EspecialidadePage.parse(
				await apiRequest<unknown>(`/especialidades?${query.toString()}`, {
					method: "GET",
					signal,
				}),
			);
			especialidades.push(...response.items);
			cursor = response.next_cursor;
			if (cursor) {
				if (cursors.has(cursor)) break;
				cursors.add(cursor);
			}
		} while (cursor);

		return especialidades;
	},
};
