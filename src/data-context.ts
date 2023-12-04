import { Dispatch, SetStateAction, createContext } from "react";
import { Project, Log, StartedProject } from "./types";

type DataContextType = {
	projects: ReadonlyArray<Project>;
	logs: ReadonlyArray<Log>;
	startedProjects: ReadonlyArray<StartedProject>;
	shouldAskForActivityName: boolean;
	setProjects: Dispatch<SetStateAction<ReadonlyArray<Project>>>;
	setLogs: Dispatch<SetStateAction<ReadonlyArray<Log>>>;
	setShouldAskForActivityName: Dispatch<SetStateAction<boolean>>;
	removeAllProjectsAndLogs: () => void;
	removeAllLogs: () => void;
	getProjectLogs: (project: Project) => ReadonlyArray<Log>;
	toggleActiveProject: (project: Project) => void;
	addProject: (project: Project) => void;
	resetProject: (project: Project) => void;
	removeProject: (project: Project) => void;
	updateProject: (project: Project) => void;
	addProjects: (projects: ReadonlyArray<Project>) => void;
	sortProjects: (projects: ReadonlyArray<string>) => void;
};

export const DataContext = createContext<DataContextType | undefined>(
	undefined,
);
