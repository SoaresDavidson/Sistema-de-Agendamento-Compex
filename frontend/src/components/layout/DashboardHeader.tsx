function getCurrentDate(date = new Date()) {
	const parts = new Intl.DateTimeFormat("pt-BR", {
		weekday: "long",
		day: "2-digit",
		month: "long",
		year: "numeric",
	}).formatToParts(date);

	const getPart = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((part) => part.type === type)?.value ?? "";

	return `${getPart("weekday")} - ${getPart("day")} ${getPart("month")} ${getPart("year")}`;
}

export function DashboardHeader() {
	return (
		<header className="sticky top-0 flex h-18 items-center justify-between border-b border-border px-8">
			<p className="font-sans text-sm text-muted-foreground">
				Clínica Aurora /{" "}
				<strong className="font-semibold text-foreground">Agendamentos</strong>
			</p>
			<p className="font-mono text-xs uppercase text-muted-foreground">
				{getCurrentDate()}
			</p>
		</header>
	);
}
