import { cn } from "./utils";

type ButtonProps = {
	children: React.ReactNode;
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	className?: string;
};

export function Button(props: ButtonProps) {
	const { children, onClick, className } = props;
	return (
		<button
			role="button"
			aria-label="Click to perform an action"
			onClick={onClick}
			className={cn(
				"flex bg-jagaatrack cursor-pointer items-center rounded-md border-2 border-black px-3 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none",
				className,
			)}
		>
			{children}
		</button>
	);
}
