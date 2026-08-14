interface ErrorStateProps {
	title?: string;
	message: string;
	icon?: string;
	onRetry?: () => void;
	className?: string;
}

export function ErrorState({
	title = "Ops, algo deu errado",
	message,
	icon = "error",
	onRetry,
	className = "",
}: ErrorStateProps) {
	return (
		<div
			className={`flex flex-col items-center justify-center rounded-2xl border border-feedback-error-bg/60 bg-card p-8 text-center shadow-sm ${className}`}
		>
			<div className="mb-4 flex size-14 items-center justify-center rounded-full bg-feedback-error-bg text-destructive">
				<span className="material-symbols-outlined select-none text-2xl leading-none">
					{icon}
				</span>
			</div>
			<h3 className="mb-1 font-heading text-base font-bold text-destructive">
				{title}
			</h3>
			<p className="mb-5 max-w-xs text-xs leading-relaxed text-muted-foreground">
				{message ||
					"Ocorreu um erro ao carregar as informações. Verifique sua conexão e tente novamente."}
			</p>
			{onRetry && (
				<button
					type="button"
					onClick={onRetry}
					className="flex items-center gap-1.5 rounded-control border border-border bg-card px-4 py-2 text-xs text-foreground hover:border-muted-foreground"
				>
					<span
						aria-hidden="true"
						className="material-symbols-outlined select-none text-sm leading-none"
					>
						refresh
					</span>
					<span>Tentar novamente</span>
				</button>
			)}
		</div>
	);
}
