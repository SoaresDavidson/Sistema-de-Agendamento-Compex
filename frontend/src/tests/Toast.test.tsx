import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toast } from "@/components/ui/Toast";

describe("Toast", () => {
	afterEach(() => vi.useRealTimers());

	it("expõe anúncio acessível e encerra automaticamente após quatro segundos", () => {
		vi.useFakeTimers();
		const onDismiss = vi.fn();
		render(
			<Toast
				title="Cliente cadastrado"
				description="Dados salvos."
				onDismiss={onDismiss}
			/>,
		);
		const status = screen.getByRole("status");
		expect(status).toHaveAttribute("aria-live", "polite");
		expect(status).toHaveAttribute("aria-atomic", "true");
		expect(status).toHaveTextContent("Cliente cadastrado");
		act(() => vi.advanceTimersByTime(3999));
		expect(onDismiss).not.toHaveBeenCalled();
		act(() => vi.advanceTimersByTime(1));
		expect(onDismiss).toHaveBeenCalledTimes(1);
	});
});
