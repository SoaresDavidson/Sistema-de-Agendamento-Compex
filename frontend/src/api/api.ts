const BASE_URL = "http://127.0.0.1:8000/api";

export class ApiError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
	const url = `${BASE_URL}${endpoint}`;
	const headers = new Headers(options.headers || {});

	const response = await fetch(url, {
		...options,
		headers,
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new ApiError(response.status, errorText);
	}
	return response.json();
}

export const api = {
	get: (endpoint: string) => apiRequest(endpoint, { method: "GET" }),
	post: (endpoint: string, body: unknown) =>
		apiRequest(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		}),
	put: (endpoint: string, body: unknown) =>
		apiRequest(endpoint, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		}),
	delete: (endpoint: string) => apiRequest(endpoint, { method: "DELETE" }),
};
