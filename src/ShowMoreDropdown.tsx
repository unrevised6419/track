import { useClickAway } from "@uidotdev/usehooks";
import { PropsWithChildren, useState } from "react";
import { HiEllipsisVertical } from "react-icons/hi2";

export function ShowMoreDropdown({ children }: PropsWithChildren) {
	const [isActiveDropdown, setIsActiveDropdown] = useState(false);
	const dropdownRef = useClickAway<HTMLDivElement>(() => {
		setIsActiveDropdown(false);
	});

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				aria-haspopup="listbox"
				aria-expanded={isActiveDropdown}
				onClick={() => {
					setIsActiveDropdown(!isActiveDropdown);
				}}
				className="flex bg-jagaatrack disabled:bg-gray-200 cursor-pointer items-center rounded-md border-2 border-black px-3 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
			>
				<HiEllipsisVertical size={20} />
			</button>
			<div
				style={{
					right: isActiveDropdown ? "80px" : "50px",
					opacity: isActiveDropdown ? "1" : "0",
					visibility: isActiveDropdown ? "visible" : "hidden",
					zIndex: isActiveDropdown ? "1" : "-1",
				}}
				className="absolute right-0 top-1/2 transition-all"
			>
				{children}
			</div>
		</div>
	);
}
