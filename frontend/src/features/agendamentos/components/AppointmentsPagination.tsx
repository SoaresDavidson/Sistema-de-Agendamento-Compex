interface AppointmentsPaginationProps {
	page: number;
	totalPages: number;
	total: number;
	size: number;
	onPageChange: (page: number) => void;
}

export function AppointmentsPagination({
	page,
	totalPages,
	total,
	size,
	onPageChange,
}: AppointmentsPaginationProps) {
	if (total === 0) {
		return null;
	}

	const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
	const canPrev = page > 1;
	const canNext = page < totalPages;

	return (
		<nav className="pagination" aria-label="Paginação">
			<span>
				Página {page} de {totalPages} · {size} registros por página
			</span>
			<div className="pages">
				<button
					type="button"
					className="page-btn"
					onClick={() => onPageChange(page - 1)}
					disabled={!canPrev}
					aria-label="Página anterior"
				>
					←
				</button>
				{pages.map((p) => (
					<button
						key={p}
						type="button"
						className={`page-btn${p === page ? " active" : ""}`}
						onClick={() => onPageChange(p)}
						aria-label={`Página ${p}`}
						aria-current={p === page ? "page" : undefined}
					>
						{p}
					</button>
				))}
				<button
					type="button"
					className="page-btn"
					onClick={() => onPageChange(page + 1)}
					disabled={!canNext}
					aria-label="Próxima página"
				>
					→
				</button>
			</div>
		</nav>
	);
}
