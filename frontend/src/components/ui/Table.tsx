import { cn } from "@/lib/utils";

function TableWrap({ className, ...props }: React.ComponentProps<"div">) {
	return <div className={cn("table-wrap", className)} {...props} />;
}

function Table({ className, ...props }: React.ComponentProps<"table">) {
	return <table className={cn("table", className)} {...props} />;
}

function THead(props: React.ComponentProps<"thead">) {
	return <thead {...props} />;
}

function TBody(props: React.ComponentProps<"tbody">) {
	return <tbody {...props} />;
}

function TR(props: React.ComponentProps<"tr">) {
	return <tr {...props} />;
}

function TH({ className, ...props }: React.ComponentProps<"th">) {
	return <th className={cn(className)} {...props} />;
}

function TD({ className, ...props }: React.ComponentProps<"td">) {
	return <td className={cn(className)} {...props} />;
}

export { Table, TableWrap, TBody, TD, TH, THead, TR };
