import { useLocation } from "react-router-dom";

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

const routeTitles: Record<string, string> = {
	"/agendamentos": "Agendamentos",
	"/horarios": "Horários",
	"/horarios/novo": "Cadastrar horários",
	"/clientes": "Clientes",
	"/especialidades": "Especialidades",
};

export function DashboardHeader() {
	const { pathname } = useLocation();
	const pageTitle = routeTitles[pathname] ?? "Visão geral";
	return (
		<header className="topbar">
			<p className="truncate text-sm text-muted-foreground">
				Clínica Aurora /{" "}
				<strong className="font-semibold text-foreground">{pageTitle}</strong>
			</p>
			<p className="topbar-date font-mono text-xs uppercase text-muted-foreground">
				{getCurrentDate()}
			</p>
		</header>
	);
}
