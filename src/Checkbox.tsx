import { Dispatch, SetStateAction } from "react";
import { MdClose } from "react-icons/md";

type Props = {
	item: string;
	isChecked: boolean;
	setIsChecked: Dispatch<SetStateAction<boolean>>;
};

export function Checkbox(props: Props) {
	return (
		<button
			onClick={() => {
				props.setIsChecked(!props.isChecked);
			}}
			className="my-2 flex items-center font-bold"
			role="checkbox"
			aria-checked={props.isChecked}
		>
			<div className="mr-2.5 grid h-5 w-5 place-items-center rounded-[5px] bg-white outline outline-2 outline-black">
				{props.isChecked && <MdClose className="h-4 w-4" />}
			</div>
			<p>{props.item}</p>
		</button>
	);
}
