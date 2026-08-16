import { z } from "zod";
import { api } from "@/api/api";
import {
	type EspecialidadeCreate,
	type EspecialidadePage,
	type EspecialidadeResponse,
	especialidadeCreateSchema,
	especialidadePageSchema,
	especialidadeResponseSchema,
} from "../types/especialidade.types";

const limiteEspecialidadesSchema = z.number().int().min(1).max(100);

export const especialidadeService = {
	async createEspecialidade(
		payload: EspecialidadeCreate,
	): Promise<EspecialidadeResponse> {
		const validPayload = especialidadeCreateSchema.parse(payload);
		const response: unknown = await api.post("/especialidades", validPayload);

		return especialidadeResponseSchema.parse(response);
	},

	async listEspecialidades(
		cursor?: string | null,
		limite = 20,
	): Promise<EspecialidadePage> {
		const limiteValido = limiteEspecialidadesSchema.parse(limite);
		const query = new URLSearchParams({ limite: String(limiteValido) });
		if (cursor) {
			query.set("cursor", cursor);
		}
		const response: unknown = await api.get(
			`/especialidades?${query.toString()}`,
		);

		return especialidadePageSchema.parse(response);
	},
};
