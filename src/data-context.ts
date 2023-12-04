import { Dispatch, SetStateAction, createContext } from "react";
import { Project, Log, StartedProject } from "./types";

type DataContextType = {
	projects: Project[];
	setProjects: Dispatch<SetStateAction<Project[]>>;
	logs: Log[];
	setLogs: Dispatch<SetStateAction<Log[]>>;
	activeProjects: StartedProject[];
	getProjectLogs: (project: Project) => Log[];
};

export const DataContext = createContext<DataContextType | undefined>(
	undefined,
);
