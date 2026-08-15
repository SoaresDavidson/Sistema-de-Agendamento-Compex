import { CheckCircle2, X } from "lucide-react";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
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

interface ToastItem {
	id: number;
	title: string;
	message: string;
}

interface ToastContextValue {
	showToast: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const idRef = useRef(0);

	const showToast = (
		title: string,
		message = "Operação simulada com dados locais.",
	) => {
		const id = ++idRef.current;
		setToasts((prev) => [...prev, { id, title, message }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 3600);
	};

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<div className="toast-region" aria-live="polite" aria-atomic="true">
				{toasts.map((toast) => (
					<div key={toast.id} className="toast">
						<span aria-hidden="true" className="toast-icon">
							✓
						</span>
						<div>
							<strong>{toast.title}</strong>
							<p>{toast.message}</p>
						</div>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast deve ser usado dentro de um ToastProvider");
	}
	return context;
}
