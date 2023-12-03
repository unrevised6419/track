import { Dispatch, SetStateAction, createContext } from "react";
import { Project, Log, StartedProject } from "./types";

type AppContextType = {
	projects: Project[];
	setProjects: Dispatch<SetStateAction<Project[]>>;
	logs: Log[];
	setLogs: Dispatch<SetStateAction<Log[]>>;
	activeProjects: StartedProject[];
	getProjectLogs: (project: Project) => Log[];
};

export const AppContext = createContext<AppContextType | undefined>(undefined);
