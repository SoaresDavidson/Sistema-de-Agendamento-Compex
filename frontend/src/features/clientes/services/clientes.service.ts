import { api } from "@/api/api";
import {
	type ClienteCreate,
	type ClientePage,
	type ClienteResponse,
	type ClienteUpdate,
	clienteCreateSchema,
	clientePageSchema,
	clienteResponseSchema,
	clienteUpdateSchema,
} from "../types/cliente.types";

export const clienteService = {
	//POST /api/clientes
	async createClient(payload: ClienteCreate): Promise<ClienteResponse> {
		const validPayload = clienteCreateSchema.parse(payload);
		const response: unknown = await api.post("/clientes", validPayload);

		return clienteResponseSchema.parse(response);
	},

	async listClients(): Promise<ClientePage> {
		//GET /api/clientes
		const response: unknown = await api.get("/clientes");
		return clientePageSchema.parse(response);
	},

	async updateClient(
		clientId: string,
		payload: ClienteUpdate,
	): Promise<ClienteResponse> {
		//PATCH /api/clientes/{clientId}
		const validPayload = clienteUpdateSchema.parse(payload);
		const response: unknown = await api.patch(
			`/clientes/${clientId}`,
			validPayload,
		);
		return clienteResponseSchema.parse(response);
	},
};
