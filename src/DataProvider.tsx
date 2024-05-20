import { useLocalStorage } from "@uidotdev/usehooks";
import { PropsWithChildren, useCallback, useMemo, useState } from "react";
import { Activity, Log, Project, StartedLog } from "./types";
import {
	addDays,
	askForActivityName,
	getDateString,
	groupBy,
	logsToMachineTimeInHours,
	msToHumanFormat,
	splitLogByTimeUnit,
	startOfDay,
	startedLogToLogs,
	storageKey,
	sumLogs,
	useEffectEvent,
	useWithClick,
} from "./utils";
import { DataContext } from "./data-context";

export type DataContextType = ReturnType<typeof useDataProvider>;

function useDataProvider() {
	const [_logs, setLogs] = useLocalStorage<ReadonlyArray<Log>>(
		storageKey("logs"),
		[],
	);

	function deleteLogs(toRemove: ReadonlyArray<Log>) {
		const newLogs = _logs.filter((l) => !toRemove.includes(l));
		setLogs(newLogs);
	}

	function addLogs(toAdd: ReadonlyArray<Log>) {
		setLogs([..._logs, ...toAdd]);
	}

	const [selectedDate, _setSelectedDate] = useState(getDateString(new Date()));
	const setSelectedDate = useCallback((date: string) => {
		if (Number.isNaN(new Date(date).getTime())) {
			_setSelectedDate(getDateString(new Date()));
		} else {
			_setSelectedDate(date);
		}
	}, []);

	const logs = useMemo(() => {
		const start = startOfDay(new Date(selectedDate));
		const end = addDays(start, 1);

		const todayLogs = _logs.filter((l) => {
			return l.startedAt >= start.getTime() && l.startedAt < end.getTime();
		});

		return todayLogs;
	}, [_logs, selectedDate]);

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

	function deleteProjects(toRemove: ReadonlyArray<Project>) {
		const newProjects = projects.filter((p) => !toRemove.includes(p));
		setProjects(newProjects);
	}

	function addProjects(toAdd: ReadonlyArray<Project>) {
		setProjects([...projects, ...toAdd]);
	}

	const addActivity = (newActivity: Activity) => {
		const filteredActivities = activities.filter((a) => {
			const sameProject = a.projectSlug === newActivity.projectSlug;
			const sameName = a.name === newActivity.name;
			return !(sameProject && sameName);
		});

		// Keep only the last 100 activities
		_setActivities([...filteredActivities, newActivity].slice(-100));
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
	const projectsBySlug = useMemo(() => {
		return groupBy(projects, "slug");
	}, [projects]);

	const getProjectLogs = useEffectEvent(
		(project: Project) => logsByProject[project.slug] ?? [],
	);

	const getProjectStartedLogs = useEffectEvent(
		(project: Project) => startedLogsByProject[project.slug] ?? [],
	);

	const getProjectActivities = useEffectEvent(
		(project: Project) => activitiesByProject[project.slug] ?? [],
	);

	const getProjectBySlug = useEffectEvent((slug: string) => {
		const projects = projectsBySlug[slug]?.at(0);
		if (!projects) throw new Error(`Project not found: ${slug}`);
		return projects;
	});

	const askForProjectActivityName = useEffectEvent((project: Project) => {
		const projectActivities = getProjectActivities(project);
		const lastActivityName = projectActivities.at(-1)?.name;
		return askForActivityName(lastActivityName);
	});

	function saveStartedLogs() {
		const newLogs = startedLogs.map<Log>((log) => ({
			projectSlug: log.projectSlug,
			activityName: log.activityName,
			startedAt: log.startedAt,
			endedAt: Date.now(),
		}));

		// Make sure to split logs that span multiple days
		addLogs(newLogs.flatMap((log) => splitLogByTimeUnit({ log, unit: "day" })));
	}

	const createNewStartedLogFromActivity = useWithClick((activity: Activity) => {
		saveStartedLogs();

		const startedLog: StartedLog = {
			projectSlug: activity.projectSlug,
			startedAt: Date.now(),
			activityName: activity.name,
		};

		setStartedLogs([startedLog]);
		addActivity(activity);
	});

	function createNewStartedLog(project: Project) {
		const startedAt = Date.now();
		const maybeActivityName = askForProjectActivityName(project);
		const activityName = maybeActivityName ?? "Unknown activity";

		const startedLog: StartedLog = {
			projectSlug: project.slug,
			startedAt,
			activityName,
		};

		setStartedLogs([startedLog]);
		if (maybeActivityName) {
			addActivity({ projectSlug: project.slug, name: maybeActivityName });
		}
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
		addProjects([project]);
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

	const importProjects = useEffectEvent((toImport: ReadonlyArray<Project>) => {
		const filteredProjects = toImport.filter(
			(p) => !projects.some((e) => e.slug === p.slug),
		);

		addProjects(filteredProjects);
	});

	const resetProject = useWithClick((project: Project) => {
		const newStartedLogs = startedLogs.filter(
			(l) => l.projectSlug !== project.slug,
		);

		deleteLogs(getProjectLogs(project));
		setStartedLogs(newStartedLogs);
	});

	const removeProject = useWithClick((project: Project) => {
		const newStartedLogs = startedLogs.filter(
			(l) => l.projectSlug !== project.slug,
		);

		deleteLogs(getProjectLogs(project));
		deleteProjects([project]);
		setStartedLogs(newStartedLogs);
	});

	const sortProjects = useEffectEvent((slugs: ReadonlyArray<string>) => {
		const newProjects = slugs
			.map((slug) => projects.find((p) => p.slug === slug))
			.filter(Boolean);

		setProjects(newProjects);
	});

	const removeLog = useWithClick((log: Log) => {
		deleteLogs([log]);
	});

	const renameProjectActivity = useWithClick((project: Project) => {
		const maybeActivityName = askForProjectActivityName(project);
		const activityName = maybeActivityName ?? "Unknown activity";

		const newStartedLogs = startedLogs.map((l) =>
			l.projectSlug === project.slug ? { ...l, activityName } : l,
		);

		setStartedLogs(newStartedLogs);
		if (maybeActivityName) {
			addActivity({ projectSlug: project.slug, name: maybeActivityName });
		}
	});

	const createProjectTracks = useEffectEvent((project: Project) => {
		const logs = [
			...getProjectLogs(project),
			...getProjectStartedLogs(project).flatMap(startedLogToLogs),
		];

		if (logs.length === 0) [];

		const logsByDay = logs.reduce<Record<string, Log[]>>((acc, log) => {
			const date = getDateString(new Date(log.startedAt));
			acc[date] = [...(acc[date] ?? []), log];
			return acc;
		}, {});

		const logsByDayEntries = Object.entries(logsByDay);

		const tracks = logsByDayEntries.map(([date, logs]) => {
			const groupByActivity = Object.entries(groupBy(logs, "activityName"));
			const activities = groupByActivity.map(([name, logs = []]) => {
				const totalTime = sumLogs(logs);
				const totalTimeHuman = msToHumanFormat(totalTime, "units");
				return `${name} (${totalTimeHuman} / x${String(logs.length)})`;
			});

			const totalTimeHours = logsToMachineTimeInHours(logs);
			const totalTime = totalTimeHours.toFixed(2);

			return `/track ${date} ${project.slug} ${totalTime} ${activities.map((a) => `- ${a}`).join("\n")}`;
		});

		return tracks;
	});

	return {
		projects,
		logs,
		startedLogs,
		activities,
		getProjectLogs,
		toggleActiveProject,
		stopAllProjects,
		addProject,
		removeAllProjectsAndLogs,
		removeAllLogs,
		startNewLog,
		importProjects,
		resetProject,
		removeProject,
		sortProjects,
		getProjectStartedLogs,
		removeLog,
		renameProjectActivity,
		getProjectBySlug,
		createNewStartedLogFromActivity,
		selectedDate,
		setSelectedDate,
		createProjectTracks,
	};
}

export function DataProvider({ children }: PropsWithChildren) {
	const value = useDataProvider();
	return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
