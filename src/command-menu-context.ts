import { createContext, useContext } from "react";
import { type CommandMenuContextType } from "./CommandMenuProvider";

export const CommandMenuContext = createContext<
	CommandMenuContextType | undefined
>(undefined);

export function useMenuProviderContext() {
	const context = useContext(CommandMenuContext);
	if (context) return context;
	const message = `useMenuProviderContext must be used within an CommandMenuProvider`;
	throw new Error(message);
}
