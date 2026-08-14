export namespace Schemas {
	// <Schemas>
	export type AgendamentoCreate = {
		cliente_id: string;
		horario_id: string;
	};
	export type StatusAgendamento = "AGENDADO" | "CANCELADO";
	export type AgendamentoResponse = {
		cliente_id: string;
		horario_id: string;
		id: string;
		status: StatusAgendamento;
		criado_em: string;
	};
	export type CancelamentoOrigem = "CLIENTE" | "MEDICO";
	export type CancelamentoRequest = {
		origem: CancelamentoOrigem;
		observacao?: string | null;
	};
	export type CancelamentoResponse = {
		id: string;
		status: StatusAgendamento;
		cancelado_por?: CancelamentoOrigem | null;
		cancelado_em?: string | null;
		observacao_cancelamento?: string | null;
	};
	export type ClienteCreate = {
		nome: string;
		telefone: string;
		email?: string | null;
		data_nascimento: string;
		confirmar_duplicidade?: boolean;
	};
	export type ClienteResponse = {
		nome: string;
		telefone: string;
		email?: string | null;
		data_nascimento: string;
		id: string;
	};
	export type ClientePage = {
		items: Array<ClienteResponse>;
		next_cursor: string | null;
	};
	export type DiaSemana =
		| "SEGUNDA"
		| "TERCA"
		| "QUARTA"
		| "QUINTA"
		| "SEXTA"
		| "SABADO"
		| "DOMINGO";
	export type EspecialidadeCreate = { nome: string };
	export type EspecialidadeResponse = {
		nome: string;
		id: string;
	};
	export type EspecialidadePage = {
		items: Array<EspecialidadeResponse>;
		next_cursor: string | null;
	};
	export type ValidationError = {
		loc: Array<string | number>;
		msg: string;
		type: string;
		input?: unknown;
		ctx?: Record<string, unknown>;
	};
	export type HTTPValidationError = Partial<{
		detail: Array<ValidationError>;
	}>;
	export type HorarioCreate = {
		medico_id: string;
		inicio: string;
		fim: string;
	};
	export type MedicoHorarioDisponivelResponse = {
		id: string;
		nome: string;
	};
	export type HorarioDisponivelResponse = {
		id: string;
		inicio: string;
		fim: string;
		medico: MedicoHorarioDisponivelResponse;
	};
	export type HorarioLoteCreate = {
		medico_id: string;
		data_inicio: string;
		data_fim: string;
		dias_semana: Array<DiaSemana>;
		inicio_periodo: string;
		fim_periodo: string;
		duracao_minutos: number;
	};
	export type HorarioResponse = {
		medico_id: string;
		inicio: string;
		fim: string;
		id: string;
		ativo: boolean;
	};
	export type HorariosLoteResponse = {
		horarios: Array<HorarioResponse>;
		total_criados: number;
	};
	export type MedicoCreate = {
		nome: string;
		especialidades_id: Array<string>;
	};
	export type MedicoResponse = {
		nome: string;
		id: string;
		especialidades: Array<EspecialidadeResponse>;
	};
	export type MedicoPage = {
		items: Array<MedicoResponse>;
		next_cursor: string | null;
	};

	// </Schemas>
}

export namespace Endpoints {
	// <Endpoints>

	export type post_Criar_api_agendamentos_post = {
		method: "POST";
		path: "/api/agendamentos";
		requestFormat: "json";
		responseFormat: "json";
		parameters: {
			body: Schemas.AgendamentoCreate;
		};
		responses: {
			201: Schemas.AgendamentoResponse;
			422: Schemas.HTTPValidationError;
		};
	};
	export type patch_Cancelar_api_agendamentos__agendamento_id__cancelar_patch =
		{
			method: "PATCH";
			path: "/api/agendamentos/{agendamento_id}/cancelar";
			requestFormat: "json";
			responseFormat: "json";
			parameters: {
				path: { agendamento_id: string };

				body: Schemas.CancelamentoRequest;
			};
			responses: {
				200: Schemas.CancelamentoResponse;
				422: Schemas.HTTPValidationError;
			};
		};
	export type post_Criar_cliente_api_clientes_post = {
		method: "POST";
		path: "/api/clientes";
		requestFormat: "json";
		responseFormat: "json";
		parameters: {
			body: Schemas.ClienteCreate;
		};
		responses: {
			201: Schemas.ClienteResponse;
			422: Schemas.HTTPValidationError;
		};
	};
	export type get_Listar_clientes_api_clientes_get = {
		method: "GET";
		path: "/api/clientes";
		requestFormat: "json";
		responseFormat: "json";
		parameters: {
			query?: Partial<{
				cursor: string | null;
				limite: number;
			}>;
		};
		responses: {
			200: Schemas.ClientePage;
			422: Schemas.HTTPValidationError;
		};
	};
	export type post_Criar_especialidade_api_especialidades_post = {
		method: "POST";
		path: "/api/especialidades";
		requestFormat: "json";
		responseFormat: "json";
		parameters: {
			body: Schemas.EspecialidadeCreate;
		};
		responses: {
			201: Schemas.EspecialidadeResponse;
			422: Schemas.HTTPValidationError;
		};
	};
	export type get_Listar_especialidades_api_especialidades_get = {
		method: "GET";
		path: "/api/especialidades";
		requestFormat: "json";
		responseFormat: "json";
		parameters: {
			query?: Partial<{
				cursor: string | null;
				limite: number;
			}>;
		};
		responses: {
			200: Schemas.EspecialidadePage;
			422: Schemas.HTTPValidationError;
		};
	};
	export type get_Listar_horarios_disponiveis_api_horarios_disponiveis_get = {
		method: "GET";
		path: "/api/horarios/disponiveis";
		requestFormat: "json";
		responseFormat: "json";
		parameters: {
			query?: Partial<{
				data: string | null;
				medico_id: string | null;
				especialidade_id: string | null;
			}>;
		};
		responses: {
			200: Array<Schemas.HorarioDisponivelResponse>;
			422: Schemas.HTTPValidationError;
		};
	};
	export type patch_Desativar_api_horarios__horario_id__desativar_patch = {
		method: "PATCH";
		path: "/api/horarios/{horario_id}/desativar";
		requestFormat: "json";
		responseFormat: "json";
		parameters: {
			path: { horario_id: string };
		};
		responses: {
			200: Schemas.HorarioResponse;
			422: Schemas.HTTPValidationError;
		};
	};
	export type post_Criar_horario_api_horarios_post = {
		method: "POST";
		path: "/api/horarios";
		requestFormat: "json";
		responseFormat: "json";
		parameters: {
			body: Schemas.HorarioCreate;
		};
		responses: {
			201: Schemas.HorarioResponse;
			422: Schemas.HTTPValidationError;
		};
	};
	export type post_Criar_horarios_em_lote_api_horarios_lote_post = {
		method: "POST";
		path: "/api/horarios/lote";
		requestFormat: "json";
		responseFormat: "json";
		parameters: {
			body: Schemas.HorarioLoteCreate;
		};
		responses: {
			201: Schemas.HorariosLoteResponse;
			422: Schemas.HTTPValidationError;
		};
	};
	export type post_Cadastrar_medico_api_medicos_post = {
		method: "POST";
		path: "/api/medicos";
		requestFormat: "json";
		responseFormat: "json";
		parameters: {
			body: Schemas.MedicoCreate;
		};
		responses: {
			201: Schemas.MedicoResponse;
			422: Schemas.HTTPValidationError;
		};
	};
	export type get_Listar_medicos_api_medicos_get = {
		method: "GET";
		path: "/api/medicos";
		requestFormat: "json";
		responseFormat: "json";
		parameters: {
			query?: Partial<{
				cursor: string | null;
				limite: number;
				nome: string | null;
				especialidade_id: string | null;
			}>;
		};
		responses: {
			200: Schemas.MedicoPage;
			422: Schemas.HTTPValidationError;
		};
	};
	export type get_Read_root__get = {
		method: "GET";
		path: "/";
		requestFormat: "json";
		responseFormat: "json";
		parameters: never;
		responses: { 200: unknown };
	};
	export type get_Health_check_api_health_get = {
		method: "GET";
		path: "/api/health";
		requestFormat: "json";
		responseFormat: "json";
		parameters: never;
		responses: { 200: unknown };
	};

	// </Endpoints>
}

// <EndpointByMethod>
export type EndpointByMethod = {
	post: {
		"/api/agendamentos": Endpoints.post_Criar_api_agendamentos_post;
		"/api/clientes": Endpoints.post_Criar_cliente_api_clientes_post;
		"/api/especialidades": Endpoints.post_Criar_especialidade_api_especialidades_post;
		"/api/horarios": Endpoints.post_Criar_horario_api_horarios_post;
		"/api/horarios/lote": Endpoints.post_Criar_horarios_em_lote_api_horarios_lote_post;
		"/api/medicos": Endpoints.post_Cadastrar_medico_api_medicos_post;
	};
	patch: {
		"/api/agendamentos/{agendamento_id}/cancelar": Endpoints.patch_Cancelar_api_agendamentos__agendamento_id__cancelar_patch;
		"/api/horarios/{horario_id}/desativar": Endpoints.patch_Desativar_api_horarios__horario_id__desativar_patch;
	};
	get: {
		"/api/clientes": Endpoints.get_Listar_clientes_api_clientes_get;
		"/api/especialidades": Endpoints.get_Listar_especialidades_api_especialidades_get;
		"/api/horarios/disponiveis": Endpoints.get_Listar_horarios_disponiveis_api_horarios_disponiveis_get;
		"/api/medicos": Endpoints.get_Listar_medicos_api_medicos_get;
		"/": Endpoints.get_Read_root__get;
		"/api/health": Endpoints.get_Health_check_api_health_get;
	};
};

// </EndpointByMethod>

// <EndpointByMethod.Shorthands>
export type PostEndpoints = EndpointByMethod["post"];
export type PatchEndpoints = EndpointByMethod["patch"];
export type GetEndpoints = EndpointByMethod["get"];
// </EndpointByMethod.Shorthands>
