import { Dispatch, SetStateAction } from "react";

type Props = {
	item: string;
	isChecked: boolean;
	setIsChecked: Dispatch<SetStateAction<boolean>>;
};

export function Checkbox(props: Props) {
	return (
		<>
			<div className="form-control">
				<label className="label cursor-pointer input input-bordered justify-start gap-3">
					<input
						type="checkbox"
						checked={props.isChecked}
						onChange={() => {
							props.setIsChecked(!props.isChecked);
						}}
						className="checkbox"
					/>
					<span className="label-text">{props.item}</span>
				</label>
			</div>
		</>
	);
}
