import { api } from "@/api/api";
import {
	type ClienteCreate,
	type ClientePage,
	type ClienteResponse,
	clienteCreateSchema,
	clientePageSchema,
	clienteResponseSchema,
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
};
