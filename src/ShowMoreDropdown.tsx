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
				className="btn btn-square btn-primary"
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
