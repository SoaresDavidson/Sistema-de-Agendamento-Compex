import { CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface ToastProps {
	title: string;
	description: string;
	onDismiss: () => void;
}

export function Toast({ title, description, onDismiss }: ToastProps) {
	useEffect(() => {
		const timeoutId = window.setTimeout(onDismiss, 4000);
		return () => window.clearTimeout(timeoutId);
	}, [onDismiss]);

	return (
		<div
			className="fixed right-4 bottom-4 z-50 flex w-[calc(100%-2rem)] max-w-sm gap-3 rounded-card border border-success/30 bg-card p-4 shadow-modal"
			role="status"
			aria-live="polite"
			aria-atomic="true"
		>
			<CheckCircle2
				className="mt-0.5 size-5 shrink-0 text-success"
				aria-hidden="true"
			/>
			<div className="min-w-0 flex-1">
				<strong className="block text-sm text-foreground">{title}</strong>
				<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			</div>
			<Button
				variant="ghost"
				size="sm"
				className="-mt-1 -mr-1 size-8 p-0"
				onClick={onDismiss}
				aria-label="Fechar notificação"
			>
				<X className="size-4" aria-hidden="true" />
			</Button>
		</div>
	);
}
