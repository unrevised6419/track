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
			className={cn(
				"rounded-md border-2 border-black p-[10px] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:translate-x-[3px] focus:translate-y-[3px] focus:shadow-none block w-full read-only:bg-gray-200",
				className,
			)}
			type="text"
			name="text"
			id="text"
			placeholder={placeholder}
			value={value}
			onChange={(e) => setValue(e.target.value)}
			aria-label={placeholder}
			readOnly={readOnly}
			ref={inputRef}
		/>
	);
}
