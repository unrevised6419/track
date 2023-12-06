import { cn } from "./utils";

type ButtonProps = {
	children: React.ReactNode;
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	className?: string;
	disabled?: boolean;
};

export function Button(props: ButtonProps) {
	const { children, onClick, className, disabled } = props;

	return (
		<button
			role="button"
			aria-label="Click to perform an action"
			onClick={onClick}
			disabled={disabled}
			className={cn("btn btn-primary btn-square", className)}
		>
			{children}
		</button>
	);
}
