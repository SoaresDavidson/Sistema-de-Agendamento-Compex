import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Appointment, CancelamentoPayload } from "../../api/types";
import { CancelamentoModal } from "../CancelamentoModal";

const fixture: Appointment = {
	id: "a1",
	cliente: "Ana Paula Ribeiro",
	medico: "Dra. Mariana Alves",
	especialidade: "Cardiologia",
	data: "10/08/2026",
	horario: "08:00–09:00",
	status: "AGENDADO",
};

function renderModal(
	onConfirm: (p: CancelamentoPayload) => void = vi.fn(),
	onClose: () => void = vi.fn(),
) {
	return render(
		<CancelamentoModal
			open
			agendamento={fixture}
			onConfirm={onConfirm}
			onClose={onClose}
		/>,
	);
}

describe("CancelamentoModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("inicia com o botão Confirmar desabilitado e habilita ao selecionar a origem", async () => {
		const user = userEvent.setup();
		renderModal();

		const confirmar = screen.getByRole("button", {
			name: "Confirmar cancelamento",
		});
		expect(confirmar).toBeDisabled();

		await user.click(screen.getByLabelText("Solicitação do cliente"));
		expect(confirmar).toBeEnabled();
	});

	it("permite preencher e ler o campo de observação opcional", async () => {
		const user = userEvent.setup();
		renderModal();

		const observacao = screen.getByLabelText("Observação opcional");
		await user.type(observacao, "Cliente solicitou reagendamento");

		expect(observacao).toHaveValue("Cliente solicitou reagendamento");
	});

	it("fechar via Manter agendamento não chama onConfirm, apenas onClose", async () => {
		const user = userEvent.setup();
		const onConfirm = vi.fn();
		const onClose = vi.fn();
		renderModal(onConfirm, onClose);

		await user.click(screen.getByLabelText("Solicitação do cliente"));
		await user.type(screen.getByLabelText("Observação opcional"), "rascunho");

		await user.click(
			screen.getByRole("button", { name: "Manter agendamento" }),
		);

		expect(onConfirm).not.toHaveBeenCalled();
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("reabrir o modal reseta origem e observação (Confirmar volta a desabilitado)", async () => {
		const user = userEvent.setup();
		const { rerender } = render(
			<CancelamentoModal
				open
				agendamento={fixture}
				onConfirm={vi.fn()}
				onClose={vi.fn()}
			/>,
		);

		await user.click(screen.getByLabelText("Solicitação do cliente"));
		await user.type(
			screen.getByLabelText("Observação opcional"),
			"texto a perder",
		);
		expect(
			screen.getByRole("button", { name: "Confirmar cancelamento" }),
		).toBeEnabled();

		rerender(
			<CancelamentoModal
				open={false}
				agendamento={fixture}
				onConfirm={vi.fn()}
				onClose={vi.fn()}
			/>,
		);
		rerender(
			<CancelamentoModal
				open
				agendamento={fixture}
				onConfirm={vi.fn()}
				onClose={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Confirmar cancelamento" }),
		).toBeDisabled();
		expect(screen.getByLabelText("Observação opcional")).toHaveValue("");
	});

	it("onConfirm recebe origem e observação (quando preenchida)", async () => {
		const user = userEvent.setup();
		const onConfirm = vi.fn();
		renderModal(onConfirm);

		await user.click(screen.getByLabelText("Indisponibilidade do médico"));
		await user.type(
			screen.getByLabelText("Observação opcional"),
			"Médico em cirurgia  ",
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Confirmar cancelamento" }),
		);

		expect(onConfirm).toHaveBeenCalledWith({
			origem: "MEDICO",
			observacao: "Médico em cirurgia",
		});
	});

	it("onConfirm recebe observacao undefined quando textarea fica vazia", async () => {
		const user = userEvent.setup();
		const onConfirm = vi.fn();
		renderModal(onConfirm);

		await user.click(screen.getByLabelText("Solicitação do cliente"));
		fireEvent.click(
			screen.getByRole("button", { name: "Confirmar cancelamento" }),
		);

		expect(onConfirm).toHaveBeenCalledWith({
			origem: "CLIENTE",
			observacao: undefined,
		});
	});
});
