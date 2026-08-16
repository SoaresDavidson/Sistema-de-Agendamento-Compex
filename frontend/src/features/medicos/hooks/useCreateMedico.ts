import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/api/api";
import { medicosService } from "../services/medicos.service";
import type { MedicoCreate, MedicoResponse } from "../types/medico.types";

export function useCreateMedico() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const submissionLockRef = useRef(false);
	const controllerRef = useRef<AbortController | null>(null);
	const isMountedRef = useRef(true);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
			controllerRef.current?.abort();
		};
	}, []);

	const createMedico = async (
		payload: MedicoCreate,
	): Promise<MedicoResponse> => {
		if (submissionLockRef.current) {
			throw new Error("Cadastro já está sendo enviado.");
		}

		submissionLockRef.current = true;
		setIsLoading(true);
		setError(null);
		const controller = new AbortController();
		controllerRef.current = controller;
		try {
			return await medicosService.create(payload, controller.signal);
		} catch (requestError) {
			const message =
				requestError instanceof ApiError && requestError.status === 409
					? "Já existe um médico com estes dados. Revise o cadastro."
					: "Não foi possível cadastrar o médico. Verifique os dados e tente novamente.";
			if (isMountedRef.current && !controller.signal.aborted) setError(message);
			throw requestError;
		} finally {
			submissionLockRef.current = false;
			if (controllerRef.current === controller) controllerRef.current = null;
			if (isMountedRef.current) setIsLoading(false);
		}
	};

	return { createMedico, isLoading, error, clearError: () => setError(null) };
}
