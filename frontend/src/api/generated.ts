// @ts-nocheck

import { z } from "zod";
import type * as __TypedOpenapi from "./generated.types.js";

// <Schemas>
export type AgendamentoCreate = __TypedOpenapi.Schemas.AgendamentoCreate;
export const AgendamentoCreate = z.object({
	cliente_id: z.uuid(),
	horario_id: z.uuid(),
});

export type StatusAgendamento = __TypedOpenapi.Schemas.StatusAgendamento;
export const StatusAgendamento = z.enum(["AGENDADO", "CANCELADO"]);

export type AgendamentoResponse = __TypedOpenapi.Schemas.AgendamentoResponse;
export const AgendamentoResponse = z.object({
	cliente_id: z.uuid(),
	horario_id: z.uuid(),
	id: z.uuid(),
	status: StatusAgendamento,
	criado_em: z.iso.datetime(),
});

export type CancelamentoOrigem = __TypedOpenapi.Schemas.CancelamentoOrigem;
export const CancelamentoOrigem = z.enum(["CLIENTE", "MEDICO"]);

export type CancelamentoRequest = __TypedOpenapi.Schemas.CancelamentoRequest;
export const CancelamentoRequest = z.object({
	origem: CancelamentoOrigem,
	observacao: z.string().nullable().optional(),
});

export type CancelamentoResponse = __TypedOpenapi.Schemas.CancelamentoResponse;
export const CancelamentoResponse = z.object({
	id: z.uuid(),
	status: StatusAgendamento,
	cancelado_por: CancelamentoOrigem.nullable().optional(),
	cancelado_em: z.iso.datetime().nullable().optional(),
	observacao_cancelamento: z.string().nullable().optional(),
});

export type ClienteCreate = __TypedOpenapi.Schemas.ClienteCreate;
export const ClienteCreate = z.object({
	nome: z.string().min(1).max(255),
	telefone: z.string().min(1).max(255),
	email: z.email().nullable().optional(),
	data_nascimento: z.iso.date(),
	confirmar_duplicidade: z.boolean().default(false),
});

export type ClienteResponse = __TypedOpenapi.Schemas.ClienteResponse;
export const ClienteResponse = z.object({
	nome: z.string().min(1).max(255),
	telefone: z.string().min(1).max(255),
	email: z.email().nullable().optional(),
	data_nascimento: z.iso.date(),
	id: z.uuid(),
});

export type ClientePage = __TypedOpenapi.Schemas.ClientePage;
export const ClientePage = z.object({
	items: z.array(ClienteResponse),
	next_cursor: z.string().nullable(),
});

export type ClienteUpdate = __TypedOpenapi.Schemas.ClienteUpdate;
export const ClienteUpdate = z
	.object({
		nome: z.string().min(1).max(255).nullable(),
		telefone: z.string().min(1).max(255).nullable(),
		email: z.email().nullable(),
		data_nascimento: z.iso.date().nullable(),
		confirmar_duplicidade: z.boolean().default(false),
	})
	.partial();

export type DiaSemana = __TypedOpenapi.Schemas.DiaSemana;
export const DiaSemana = z.enum([
	"SEGUNDA",
	"TERCA",
	"QUARTA",
	"QUINTA",
	"SEXTA",
	"SABADO",
	"DOMINGO",
]);

export type EspecialidadeCreate = __TypedOpenapi.Schemas.EspecialidadeCreate;
export const EspecialidadeCreate = z.object({
	nome: z.string().min(1).max(255),
});

export type EspecialidadeResponse =
	__TypedOpenapi.Schemas.EspecialidadeResponse;
export const EspecialidadeResponse = z.object({
	nome: z.string().min(1).max(255),
	id: z.uuid(),
});

export type EspecialidadePage = __TypedOpenapi.Schemas.EspecialidadePage;
export const EspecialidadePage = z.object({
	items: z.array(EspecialidadeResponse),
	next_cursor: z.string().nullable(),
});

export type ValidationError = __TypedOpenapi.Schemas.ValidationError;
export const ValidationError = z.object({
	loc: z.array(z.union([z.string(), z.number().int()])),
	msg: z.string(),
	type: z.string(),
	input: z.unknown().optional(),
	ctx: z.record(z.string(), z.unknown()).optional(),
});

export type HTTPValidationError = __TypedOpenapi.Schemas.HTTPValidationError;
export const HTTPValidationError = z
	.object({ detail: z.array(ValidationError) })
	.partial();

export type HorarioCreate = __TypedOpenapi.Schemas.HorarioCreate;
export const HorarioCreate = z.object({
	medico_id: z.uuid(),
	inicio: z.iso.datetime(),
	fim: z.iso.datetime(),
});

export type MedicoHorarioDisponivelResponse =
	__TypedOpenapi.Schemas.MedicoHorarioDisponivelResponse;
export const MedicoHorarioDisponivelResponse = z.object({
	id: z.uuid(),
	nome: z.string(),
});

export type HorarioDisponivelResponse =
	__TypedOpenapi.Schemas.HorarioDisponivelResponse;
export const HorarioDisponivelResponse = z.object({
	id: z.uuid(),
	inicio: z.iso.datetime(),
	fim: z.iso.datetime(),
	medico: MedicoHorarioDisponivelResponse,
});

export type HorarioLoteCreate = __TypedOpenapi.Schemas.HorarioLoteCreate;
export const HorarioLoteCreate = z.object({
	medico_id: z.uuid(),
	data_inicio: z.iso.date(),
	data_fim: z.iso.date(),
	dias_semana: z
		.array(DiaSemana)
		.min(1)
		.refine((arr) => new Set(arr).size === arr.length, {
			message: "uniqueItems",
		}),
	inicio_periodo: z.iso.time(),
	fim_periodo: z.iso.time(),
	duracao_minutos: z.number().int().gt(0),
});

export type HorarioResponse = __TypedOpenapi.Schemas.HorarioResponse;
export const HorarioResponse = z.object({
	medico_id: z.uuid(),
	inicio: z.iso.datetime(),
	fim: z.iso.datetime(),
	id: z.uuid(),
	ativo: z.boolean(),
});

export type HorariosLoteResponse = __TypedOpenapi.Schemas.HorariosLoteResponse;
export const HorariosLoteResponse = z.object({
	horarios: z.array(HorarioResponse),
	total_criados: z.number().int(),
});

export type MedicoCreate = __TypedOpenapi.Schemas.MedicoCreate;
export const MedicoCreate = z.object({
	nome: z.string().min(1).max(255),
	especialidades_id: z.array(z.uuid()),
});

export type MedicoResponse = __TypedOpenapi.Schemas.MedicoResponse;
export const MedicoResponse = z.object({
	nome: z.string().min(1).max(255),
	id: z.uuid(),
	especialidades: z.array(EspecialidadeResponse),
});

export type MedicoPage = __TypedOpenapi.Schemas.MedicoPage;
export const MedicoPage = z.object({
	items: z.array(MedicoResponse),
	next_cursor: z.string().nullable(),
});

// </Schemas>
