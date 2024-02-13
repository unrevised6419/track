import { useLocalStorage } from "@uidotdev/usehooks";
import { PropsWithChildren, useMemo } from "react";
import { Log, Project, StartedLog } from "./types";
import {
	askForActivityName,
	groupBy,
	storageKey,
	useEffectEvent,
	useWithClick,
} from "./utils";
import { DataContext } from "./data-context";

export type DataContextType = ReturnType<typeof useDataProvider>;

function useDataProvider() {
	const [shouldAskForActivityName, setShouldAskForActivityName] =
		useLocalStorage(storageKey("should-ask-for-activity-name"), false);

	const [logs, setLogs] = useLocalStorage<ReadonlyArray<Log>>(
		storageKey("logs"),
		[],
	);

	const [projects, setProjects] = useLocalStorage<ReadonlyArray<Project>>(
		storageKey("projects"),
		[],
	);
	const [startedLogs, setStartedLogs] = useLocalStorage<
		ReadonlyArray<StartedLog>
	>(storageKey("started-logs"), []);

	const [lastActivities, setLastActivities] = useLocalStorage<
		Partial<Record<string, string>>
	>(storageKey("last-activities"), {});

	const logsByProject = useMemo(() => groupBy(logs, "projectSlug"), [logs]);
	const startedLogsByProject = useMemo(
		() => groupBy(startedLogs, "projectSlug"),
		[startedLogs],
	);

	const getProjectLogs = useEffectEvent(
		(project: Project) => logsByProject[project.slug] ?? [],
	);

	const getProjectStartedLogs = useEffectEvent(
		(project: Project) => startedLogsByProject[project.slug] ?? [],
	);

	function saveStartedLogs() {
		const newLogs = startedLogs.map<Log>((log) => ({
			projectSlug: log.projectSlug,
			activityName: log.activityName,
			startedAt: log.startedAt,
			endedAt: Date.now(),
		}));

		setLogs([...logs, ...newLogs]);
	}

	function createNewStartedLog(project: Project) {
		const startedAt = Date.now();
		const previousActivityName = lastActivities[project.slug] ?? project.name;
		const activityName = shouldAskForActivityName
			? askForActivityName(previousActivityName)
			: "Unknown activity";

		const startedLog: StartedLog = {
			projectSlug: project.slug,
			startedAt,
			activityName,
		};

		setStartedLogs([startedLog]);
		setLastActivities({
			...lastActivities,
			[project.slug]: startedLog.activityName,
		});
	}

	const stopAllProjects = useWithClick(() => {
		saveStartedLogs();
		setStartedLogs([]);
	});

	const toggleActiveProject = useWithClick((project: Project) => {
		saveStartedLogs();

		const projectHasStartedLog = startedLogs.some(
			(l) => l.projectSlug === project.slug,
		);

		if (projectHasStartedLog) {
			setStartedLogs([]);
		} else {
			createNewStartedLog(project);
		}
	});

	const startNewLog = useWithClick(() => {
		saveStartedLogs();

		const project = projects.find(
			// Start a new log for first found project
			(p) => p.slug === startedLogs.at(0)?.projectSlug,
		);

		if (project) {
			createNewStartedLog(project);
		}
	});

	const addProject = useEffectEvent((project: Project) => {
		setProjects([project, ...projects]);
	});

	const removeAllProjectsAndLogs = useEffectEvent(() => {
		setProjects([]);
		setLogs([]);
		setStartedLogs([]);
	});

	const removeAllLogs = useEffectEvent(() => {
		setLogs([]);
		setStartedLogs([]);
	});

	const addProjects = useEffectEvent((newProjects: ReadonlyArray<Project>) => {
		const filteredProjects = newProjects.filter(
			(p) => !projects.some((e) => e.slug === p.slug),
		);

		setProjects([...projects, ...filteredProjects]);
	});

	const resetProject = useWithClick((project: Project) => {
		const newLogs = logs.filter((l) => l.projectSlug !== project.slug);
		const newStartedLogs = startedLogs.filter(
			(l) => l.projectSlug !== project.slug,
		);

		setLogs(newLogs);
		setStartedLogs(newStartedLogs);
	});

	const removeProject = useWithClick((project: Project) => {
		const newProjects = projects.filter((e) => e.slug !== project.slug);
		const newLogs = logs.filter((l) => l.projectSlug !== project.slug);
		const newStartedLogs = startedLogs.filter(
			(l) => l.projectSlug !== project.slug,
		);

		setProjects(newProjects);
		setLogs(newLogs);
		setStartedLogs(newStartedLogs);
	});

	const sortProjects = useEffectEvent((slugs: ReadonlyArray<string>) => {
		const newProjects = slugs
			.map((slug) => projects.find((p) => p.slug === slug))
			.filter(Boolean);

		setProjects(newProjects);
	});

	const removeLog = useWithClick((log: Log) => {
		const newLogs = logs.filter((l) => l !== log);
		setLogs(newLogs);
	});

	const renameProjectActivity = useWithClick((project: Project) => {
		const activityName = askForActivityName(lastActivities[project.slug]);

		setLastActivities({
			...lastActivities,
			[project.slug]: activityName,
		});

		const newStartedLogs = startedLogs.map((l) =>
			l.projectSlug === project.slug ? { ...l, activityName } : l,
		);

		setStartedLogs(newStartedLogs);
	});

	return {
		projects,
		logs,
		startedLogs,
		shouldAskForActivityName,
		setProjects,
		setLogs,
		getProjectLogs,
		setShouldAskForActivityName,
		toggleActiveProject,
		stopAllProjects,
		addProject,
		removeAllProjectsAndLogs,
		removeAllLogs,
		startNewLog,
		addProjects,
		resetProject,
		removeProject,
		sortProjects,
		lastActivities,
		setLastActivities,
		getProjectStartedLogs,
		removeLog,
		renameProjectActivity,
	};
}

export function DataProvider({ children }: PropsWithChildren) {
	const value = useDataProvider();
	return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
