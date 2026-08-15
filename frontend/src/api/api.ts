const BASE_URL = "http://127.0.0.1:8000/api";

export class ApiError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}

export async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const url = `${BASE_URL}${endpoint}`;
	const headers = new Headers(options.headers || {});

	const response = await fetch(url, {
		...options,
		headers,
	});

	if (!response.ok) {
		const errorBody = await response.json().catch(() => ({}));
		const detail = errorBody.detail ?? errorBody.mensagem;
		const message =
			typeof detail === "string" ? detail : JSON.stringify(detail ?? errorBody);
		throw new ApiError(response.status, message);
	}
	return (await response.json()) as T;
}

export const api = {
	get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: "GET" }),
	post: <T>(endpoint: string, body: unknown) =>
		apiRequest<T>(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		}),
	put: <T>(endpoint: string, body: unknown) =>
		apiRequest<T>(endpoint, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		}),
	patch: <T>(endpoint: string, body: unknown) =>
		apiRequest<T>(endpoint, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		}),
	delete: <T>(endpoint: string) =>
		apiRequest<T>(endpoint, { method: "DELETE" }),
};
