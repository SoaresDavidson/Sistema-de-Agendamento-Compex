import type { AppointmentStatus } from "../api/types";

interface StatusBadgeProps {
	status: AppointmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
	return (
		<span className={`status status-${status.toLowerCase()}`}>{status}</span>
	);
}
