import {
	createContext,
	type ReactNode,
	useContext,
	useRef,
	useState,
} from "react";

interface Toast {
	id: number;
	title: string;
	message: string;
}

interface ToastContextValue {
	showToast: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);
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
