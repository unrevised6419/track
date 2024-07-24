import { createContext, useContext } from "react";
import { type DataContextType } from "./data.provider";

export const DataContext = createContext<DataContextType | undefined>(
	undefined,
);

export function useDataContext() {
	const context = useContext(DataContext);
	if (context) return context;
	throw new Error("useAppContext must be used within an AppProvider");
}
