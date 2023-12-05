import { Dispatch, SetStateAction, createContext } from "react";
import { Project, Log, StartedLog } from "./types";

type DataContextType = {
	projects: ReadonlyArray<Project>;
	logs: ReadonlyArray<Log>;
	startedLogs: ReadonlyArray<StartedLog>;
	shouldAskForActivityName: boolean;
	lastActivities: Partial<Record<string, string>>;
	setProjects: Dispatch<SetStateAction<ReadonlyArray<Project>>>;
	setLogs: Dispatch<SetStateAction<ReadonlyArray<Log>>>;
	setShouldAskForActivityName: Dispatch<SetStateAction<boolean>>;
	removeAllProjectsAndLogs: () => void;
	removeAllLogs: () => void;
	getProjectLogs: (project: Project) => ReadonlyArray<Log>;
	getProjectStartedLogs: (project: Project) => ReadonlyArray<StartedLog>;
	toggleActiveProject: (project: Project) => void;
	addProject: (project: Project) => void;
	resetProject: (project: Project) => void;
	removeProject: (project: Project) => void;
	addProjects: (projects: ReadonlyArray<Project>) => void;
	sortProjects: (projects: ReadonlyArray<string>) => void;
	setLastActivities: Dispatch<SetStateAction<Partial<Record<string, string>>>>;
};

export const DataContext = createContext<DataContextType | undefined>(
	undefined,
);
