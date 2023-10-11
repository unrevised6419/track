import {
	Dispatch,
	ReactNode,
	SetStateAction,
	useEffect,
	useState,
} from "react";
import ReactDom from "react-dom";
import { MdClose } from "react-icons/md";

type Props = {
	active: boolean;
	setActive: Dispatch<SetStateAction<boolean>>;
	children: ReactNode;
};

export function Modal({ active, setActive, children }: Props) {
	const [isVisible, setIsVisible] = useState(false);

	const closeModal = () => {
		setIsVisible(false);
		setTimeout(() => {
			setActive(false);
		}, 300);
	};

	useEffect(() => {
		if (active) {
			setIsVisible(true);
		}
	}, [active]);

	if (!active) return null;

	const modalElement = document.getElementById("modal");

	if (!modalElement) return null;

	return ReactDom.createPortal(
		<div
			role="dialog"
			aria-modal="true"
			className="fixed left-0 top-0 flex h-screen w-screen items-center justify-center bg-black/50"
		>
			<div
				style={{
					opacity: isVisible ? "1" : "0",
					visibility: isVisible ? "visible" : "hidden",
				}}
				className="relative flex w-[350px] flex-col items-center justify-center rounded-md border-2 border-black bg-jagaatrack p-10 pt-12 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
			>
				<button onClick={closeModal}>
					<MdClose className="absolute right-3 top-3 h-6 w-6" />
				</button>
				{children}
				<button
					className="mt-5 cursor-pointer rounded-md border-2 border-black bg-white px-4 py-1.5 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
					onClick={closeModal}
				>
					Ok
				</button>
			</div>
		</div>,
		modalElement,
	);
}
