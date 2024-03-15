import { useLocalStorage } from "@uidotdev/usehooks";
import { PropsWithChildren, useMemo } from "react";
import { Activity, Log, Project, StartedLog } from "./types";
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

	const [activities, _setActivities] = useLocalStorage<ReadonlyArray<Activity>>(
		storageKey("activities"),
		[],
	);

	const setProjectActivity = (project: Project, activityName?: string) => {
		if (!activityName) return;

		const foundActivity = activities.find(
			(a) => a.projectSlug === project.slug && a.name === activityName,
		);

		if (foundActivity) return;

		const newActivity: Activity = {
			name: activityName,
			projectSlug: project.slug,
		};

		_setActivities(
			// Keep only the last 100 activities
			[...activities, newActivity].slice(-100),
		);
	};

	const logsByProject = useMemo(() => groupBy(logs, "projectSlug"), [logs]);
	const startedLogsByProject = useMemo(
		() => groupBy(startedLogs, "projectSlug"),
		[startedLogs],
	);
	const activitiesByProject = useMemo(
		() => groupBy(activities, "projectSlug"),
		[activities],
	);

	const getProjectLogs = useEffectEvent(
		(project: Project) => logsByProject[project.slug] ?? [],
	);

	const getProjectStartedLogs = useEffectEvent(
		(project: Project) => startedLogsByProject[project.slug] ?? [],
	);

	const getProjectActivities = useEffectEvent(
		(project: Project) => activitiesByProject[project.slug] ?? [],
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
		const projectActivities = getProjectActivities(project);
		const lastActivityName = projectActivities.at(-1)?.name;
		const maybeActivityName = askForActivityName(lastActivityName);
		const activityName = maybeActivityName ?? "Unknown activity";

		const startedLog: StartedLog = {
			projectSlug: project.slug,
			startedAt,
			activityName,
		};

		setStartedLogs([startedLog]);
		setProjectActivity(project, maybeActivityName);
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
		const projectActivities = getProjectActivities(project);
		const lastActivityName = projectActivities.at(-1)?.name;
		const maybeActivityName = askForActivityName(lastActivityName);
		const activityName = maybeActivityName ?? "Unknown activity";

		setProjectActivity(project, maybeActivityName);

		const newStartedLogs = startedLogs.map((l) =>
			l.projectSlug === project.slug ? { ...l, activityName } : l,
		);

		setStartedLogs(newStartedLogs);
	});

	return {
		projects,
		logs,
		startedLogs,
		setProjects,
		setLogs,
		getProjectLogs,
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
		getProjectStartedLogs,
		removeLog,
		renameProjectActivity,
	};
}

export function DataProvider({ children }: PropsWithChildren) {
	const value = useDataProvider();
	return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
