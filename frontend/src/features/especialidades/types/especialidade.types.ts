import { z } from "zod";
import { EspecialidadeCreate as generatedEspecialidadeCreateSchema } from "@/api/generated";

export type {
	EspecialidadeCreate,
	EspecialidadePage,
	EspecialidadeResponse,
} from "@/api/generated";
export {
	EspecialidadePage as especialidadePageSchema,
	EspecialidadeResponse as especialidadeResponseSchema,
} from "@/api/generated";

const nomeEspecialidadeSchema = z
	.string()
	.transform((nome) => nome.trim().replace(/\s+/g, " "))
	.pipe(z.string().min(1).max(255));

export const especialidadeCreateSchema =
	generatedEspecialidadeCreateSchema.extend({
		nome: nomeEspecialidadeSchema,
	});
