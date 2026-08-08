import type { ComponentProps } from "react";

function Skeleton({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
			{...props}
		/>
	);
}

export { Skeleton };
