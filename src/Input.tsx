import { Ref } from "react";
import { cn } from "./utils";

type InputProps = {
	value: string;
	setValue: React.Dispatch<React.SetStateAction<string>>;
	placeholder: string;
	readOnly?: boolean;
	inputRef?: Ref<HTMLInputElement>;
	className?: string;
};

export function Input({
	value,
	setValue,
	placeholder,
	readOnly,
	inputRef,
	className,
}: InputProps) {
	return (
		<input
			className={cn("input input-bordered", className)}
			type="text"
			placeholder={placeholder}
			value={value}
			onChange={(e) => {
				setValue(e.target.value);
			}}
			aria-label={placeholder}
			readOnly={readOnly}
			ref={inputRef}
		/>
	);
}
