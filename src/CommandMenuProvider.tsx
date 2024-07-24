import { PropsWithChildren, useState } from "react";
import { CommandMenuContext } from "./command-menu-context";
import { useWithClick } from "./utils";

export type CommandMenuContextType = ReturnType<typeof useCommandMenuProvider>;

function useCommandMenuProvider() {
	const [showCommandMenu, setShowCommandMenu] = useState(false);

	const toggleCommandMenu = useWithClick(() => {
		setShowCommandMenu(!showCommandMenu);
	});

	return {
		showCommandMenu,
		setShowCommandMenu,
		toggleCommandMenu,
	};
}

export function CommandMenuProvider({ children }: PropsWithChildren) {
	const value = useCommandMenuProvider();

	return (
		<CommandMenuContext.Provider value={value}>
			{children}
		</CommandMenuContext.Provider>
	);
}
