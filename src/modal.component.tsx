import { Dispatch, ReactNode, SetStateAction, useEffect, useRef } from "react";

type Props = {
	active: boolean;
	setActive: Dispatch<SetStateAction<boolean>>;
	children: ReactNode;
};

export function Modal({ active, setActive, children }: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		if (active) {
			dialogRef.current?.showModal();
		} else {
			dialogRef.current?.close();
		}
	}, [active]);

	return (
		<dialog className="modal" ref={dialogRef}>
			<div className="modal-box">
				<button
					className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
					onClick={() => {
						setActive(false);
					}}
				>
					✕
				</button>
				{children}
			</div>
			<button
				onClick={() => {
					setActive(false);
				}}
				className="modal-backdrop"
			></button>
		</dialog>
	);
}
