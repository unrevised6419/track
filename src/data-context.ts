import { Dispatch, SetStateAction, createContext } from "react";
import { Project, Log, StartedProject } from "./types";

type DataContextType = {
	projects: ReadonlyArray<Project>;
	setProjects: Dispatch<SetStateAction<ReadonlyArray<Project>>>;
	logs: ReadonlyArray<Log>;
	setLogs: Dispatch<SetStateAction<ReadonlyArray<Log>>>;
	activeProjects: ReadonlyArray<StartedProject>;
	getProjectLogs: (project: Project) => ReadonlyArray<Log>;
	shouldAskForActivityName: boolean;
	setShouldAskForActivityName: Dispatch<SetStateAction<boolean>>;
	toggleActiveProject: (project: Project) => void;
	addProject: (project: Project) => void;
	removeAllProjectsAndLogs: () => void;
	removeAllLogs: () => void;
	addProjects: (projects: ReadonlyArray<Project>) => void;
	resetProject: (project: Project) => void;
	removeProject: (project: Project) => void;
	updateProject: (project: Project) => void;
	sortProjects: (projects: ReadonlyArray<string>) => void;
};

export const DataContext = createContext<DataContextType | undefined>(
	undefined,
);
