import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("btn", {
	variants: {
		variant: {
			primary: "btn-primary",
			secondary: "btn-secondary",
			ghost: "btn-ghost",
			danger: "btn-danger",
		},
		size: {
			default: "",
			sm: "btn-sm",
		},
	},
	defaultVariants: {
		variant: "primary",
		size: "default",
	},
});

type ButtonProps = React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants>;

export function Button({
	className,
	variant,
	size,
	type = "button",
	...props
}: ButtonProps) {
	return (
		<button
			type={type}
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		/>
	);
}

export { buttonVariants };
