import { z } from "zod";
import {
	MedicoCreate as generatedMedicoCreateSchema,
	MedicoPage as generatedMedicoPageSchema,
	MedicoResponse as generatedMedicoResponseSchema,
} from "@/api/generated";

export type {
	EspecialidadeResponse,
	MedicoCreate,
	MedicoPage,
	MedicoResponse,
} from "@/api/generated";

const nomeMedicoSchema = z
	.string()
	.transform((nome) => nome.trim().replace(/\s+/g, " "))
	.pipe(z.string().min(1).max(255));

export const medicoCreateSchema = generatedMedicoCreateSchema.extend({
	nome: nomeMedicoSchema,
	especialidades_id: z.array(z.uuid()).min(1),
});

export const medicoPageSchema = generatedMedicoPageSchema;
export const medicoResponseSchema = generatedMedicoResponseSchema;

export interface MedicoFilters {
	nome: string;
	especialidadeId: string;
}
