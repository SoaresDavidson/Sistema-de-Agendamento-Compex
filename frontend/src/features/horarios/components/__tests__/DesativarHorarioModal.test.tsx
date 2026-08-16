import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HorarioDisponivelResponse } from "@/api/generated";
import { DesativarHorarioModal } from "../DesativarHorarioModal";

const horario: HorarioDisponivelResponse = {
	id: "22222222-2222-4222-8222-222222222222",
	inicio: "2026-09-10T08:00:00Z",
	fim: "2026-09-10T09:00:00Z",
	medico: {
		id: "11111111-1111-4111-8111-111111111111",
		nome: "Dra. Mariana Alves",
	},
};

function renderModal(
	onConfirm: () => void = vi.fn(),
	onClose: () => void = vi.fn(),
	props: { submitting?: boolean; error?: string } = {},
) {
	return render(
		<DesativarHorarioModal
			open
			horario={horario}
			onConfirm={onConfirm}
			onClose={onClose}
			submitting={props.submitting}
			error={props.error}
		/>,
	);
}

describe("DesativarHorarioModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("exibe o horário identificado no modal", () => {
		renderModal();
		expect(screen.getByText(/Dra\. Mariana Alves/)).toBeInTheDocument();
		expect(screen.getByText(/10\/09\/2026/)).toBeInTheDocument();
		expect(screen.getByText(/08:00–09:00/)).toBeInTheDocument();
	});

	it("exige confirmação explícita antes de chamar onConfirm", async () => {
		const user = userEvent.setup();
		const onConfirm = vi.fn();
		renderModal(onConfirm);

		const confirmar = screen.getByRole("button", {
			name: "Desativar horário",
		});
		await user.click(confirmar);
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it("fechar via Manter ativo não chama onConfirm, apenas onClose", async () => {
		const user = userEvent.setup();
		const onConfirm = vi.fn();
		const onClose = vi.fn();
		renderModal(onConfirm, onClose);

		await user.click(
			screen.getByRole("button", {
				name: "Manter ativo",
			}),
		);

		expect(onConfirm).not.toHaveBeenCalled();
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("fechar via backdrop não chama onConfirm, apenas onClose", async () => {
		const onConfirm = vi.fn();
		const onClose = vi.fn();
		renderModal(onConfirm, onClose);

		const backdrop = document.querySelector(".modal-backdrop");
		if (backdrop) fireEvent.click(backdrop);
		expect(onConfirm).not.toHaveBeenCalled();
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("fechar via ESC chama onClose", async () => {
		const onConfirm = vi.fn();
		const onClose = vi.fn();
		renderModal(onConfirm, onClose);

		const backdrop = document.querySelector(".modal-backdrop");
		if (backdrop) fireEvent.keyDown(backdrop, { key: "Escape" });
		expect(onConfirm).not.toHaveBeenCalled();
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("desabilita botões durante submitting e mostra 'Desativando...'", () => {
		renderModal(vi.fn(), vi.fn(), { submitting: true });

		const confirmar = screen.getByRole("button", {
			name: "Desativando...",
		});
		expect(confirmar).toBeDisabled();

		const manter = screen.getByRole("button", {
			name: "Manter ativo",
		});
		expect(manter).toBeDisabled();
	});

	it("não chama onConfirm se clicar em Confirmar durante submitting", async () => {
		const user = userEvent.setup();
		const onConfirm = vi.fn();
		renderModal(onConfirm, vi.fn(), { submitting: true });

		await user.click(screen.getByRole("button", { name: "Desativando..." }));

		expect(onConfirm).not.toHaveBeenCalled();
	});

	it("exibe mensagem de erro", async () => {
		renderModal(vi.fn(), vi.fn(), { error: "Erro de rede" });

		expect(screen.getByText("Erro de rede")).toBeInTheDocument();
	});

	it("foca no botão Manter ativo ao abrir", () => {
		renderModal();
		const manter = screen.getByRole("button", { name: "Manter ativo" });
		expect(manter).toHaveFocus();
	});
});