import { useLocalStorage } from "@uidotdev/usehooks";
import { PropsWithChildren, useCallback, useMemo } from "react";
import { Log, Project } from "./types";
import { groupBy, isStartedProject, storageKey } from "./utils";
import { DataContext } from "./data-context";

export function DataProvider({ children }: PropsWithChildren) {
	const [logs, setLogs] = useLocalStorage<Log[]>(storageKey("logs"), []);
	const [projects, setProjects] = useLocalStorage<Project[]>(
		storageKey("projects"),
		[],
	);

	const activeProjects = useMemo(
		() => projects.filter(isStartedProject),
		[projects],
	);

	const logsByProject = useMemo(() => groupBy(logs, "projectSlug"), [logs]);

	const getProjectLogs = useCallback(
		(project: Project) => logsByProject[project.slug] ?? [],
		[logsByProject],
	);

	return (
		<DataContext.Provider
			value={{
				projects,
				setProjects,
				logs,
				setLogs,
				activeProjects,
				getProjectLogs,
			}}
		>
			{children}
		</DataContext.Provider>
	);
}
