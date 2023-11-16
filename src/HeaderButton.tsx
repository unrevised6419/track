import { PropsWithChildren } from "react";

type HeaderButtonProps = PropsWithChildren<{
	onClick: () => void;
	title?: string;
}>;

export function HeaderButton(props: HeaderButtonProps) {
	return (
		<button
			onClick={props.onClick}
			className="p-1.5 sm:p-3 bg-gray-200 rounded-md hover:bg-gray-300 transition-all"
			title={props.title}
		>
			{props.children}
		</button>
	);
}
