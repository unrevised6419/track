import { PropsWithChildren } from "react";

type HeaderButtonProps = PropsWithChildren<{
	onClick: () => void;
	title?: string;
}>;

export function HeaderButton(props: HeaderButtonProps) {
	return (
		<button
			onClick={props.onClick}
			className="btn btn-square btn-sm sm:btn-md"
			title={props.title}
		>
			{props.children}
		</button>
	);
}
