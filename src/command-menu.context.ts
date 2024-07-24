import { createContext, useContext } from "react";
import { type CommandMenuContextType } from "./command-menu.provider";

export const CommandMenuContext = createContext<
	CommandMenuContextType | undefined
>(undefined);

export function useCommandMenuContext() {
	const context = useContext(CommandMenuContext);
	if (context) return context;
	const message = `useMenuProviderContext must be used within an CommandMenuProvider`;
	throw new Error(message);
}
