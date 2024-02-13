import { createContext } from "react";
import { type DataContextType } from "./DataProvider";

export const DataContext = createContext<DataContextType | undefined>(
	undefined,
);
