import { PropsWithChildren, useCallback, useMemo, useState } from "react";
import { Activity, Log, Project, StartedLog } from "./types";
import {
	addDays,
	getDateString,
	groupBy,
	logsToMachineTimeInHours,
	msToHumanFormat,
	removeProjectDuplicates,
	splitLogByTimeUnit,
	startOfDay,
	startedLogToLogs,
	sumLogs,
	useAppLocalStorage,
	useEffectEvent,
	useWithClick,
} from "./utils";
import { DataContext } from "./data.context";

export type DataContextType = ReturnType<typeof useDataProvider>;

const todayDate = new Date();
const todayDateString = getDateString(todayDate);
const thirtyDaysAgo = startOfDay(addDays(todayDate, -30)).getTime();

function useDataProvider() {
	const [selectedDate, _setSelectedDate] = useState(todayDateString);
	const selectedDateIsToday = selectedDate === todayDateString;
	const selectedDateRange = useMemo(() => {
		const start = startOfDay(new Date(selectedDate));
		const end = addDays(start, 1);
		return { start: start.getTime(), end: end.getTime() };
	}, [selectedDate]);

	const setSelectedDate = useCallback((date: string) => {
		if (Number.isNaN(new Date(date).getTime())) {
			_setSelectedDate(getDateString(new Date()));
		} else {
			_setSelectedDate(date);
		}
	}, []);

	const [_logs, _setLogs] = useAppLocalStorage<ReadonlyArray<Log>>("logs", []);
	const setLogs = useCallback(
		(logs: ReadonlyArray<Log>) => {
			_setLogs(logs.filter((l) => l.startedAt > thirtyDaysAgo));
		},
		[_setLogs],
	);

	function deleteLogs(toRemove: ReadonlyArray<Log>) {
		const newLogs = _logs.filter((l) => !toRemove.includes(l));
		setLogs(newLogs);
	}

	const addLogs = useCallback(
		(toAdd: ReadonlyArray<Log>) => {
			setLogs([..._logs, ...toAdd]);
		},
		[_logs, setLogs],
	);

	const logs = useMemo<ReadonlyArray<Log>>(() => {
		const { start, end } = selectedDateRange;
		return _logs.filter((l) => {
			return l.startedAt >= start && l.startedAt < end;
		});
	}, [_logs, selectedDateRange]);

	const [projects, setProjects] = useAppLocalStorage<ReadonlyArray<Project>>(
		"projects",
		[],
	);

	const [startedLogs, setStartedLogs] = useAppLocalStorage<
		ReadonlyArray<StartedLog>
	>("started-logs", []);

	const hasStartedLogs = startedLogs.length > 0;

	const [activities, _setActivities] = useAppLocalStorage<
		ReadonlyArray<Activity>
	>("activities", []);

	function deleteProjects(toRemove: ReadonlyArray<Project>) {
		const newProjects = projects.filter((p) => !toRemove.includes(p));
		setProjects(newProjects);
	}

	function addProjects(toAdd: ReadonlyArray<Project>) {
		setProjects([...projects, ...toAdd]);
	}

	const addActivity = useCallback(
		(newActivity: Activity) => {
			const filteredActivities = activities.filter((a) => {
				const sameProject = a.projectSlug === newActivity.projectSlug;
				const sameName = a.name === newActivity.name;
				return !(sameProject && sameName);
			});

			// Keep only the last 100 activities
			_setActivities([...filteredActivities, newActivity].slice(-100));
		},
		[_setActivities, activities],
	);

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

	const getProjectActivities = useEffectEvent((project: Project | string) => {
		const slug = typeof project === "string" ? project : project.slug;
		return activitiesByProject[slug] ?? [];
	});

	const getProjectBySlug = useEffectEvent((slug: string) => {
		const projects = projectsBySlug[slug]?.at(0);
		if (!projects) throw new Error(`Project not found: ${slug}`);
		return projects;
	});

	const saveStartedLogs = useCallback(() => {
		const newLogs = startedLogs.map<Log>((log) => ({
			projectSlug: log.projectSlug,
			activityName: log.activityName,
			startedAt: log.startedAt,
			endedAt: Date.now(),
		}));

		// Make sure to split logs that span multiple days
		addLogs(newLogs.flatMap((log) => splitLogByTimeUnit({ log, unit: "day" })));
	}, [addLogs, startedLogs]);

	const createNewStartedLogFromActivity = useCallback(
		(activity: Activity) => {
			saveStartedLogs();

			const startedLog: StartedLog = {
				projectSlug: activity.projectSlug,
				startedAt: Date.now(),
				activityName: activity.name,
			};

			setStartedLogs([startedLog]);
			addActivity(activity);
		},
		[addActivity, saveStartedLogs, setStartedLogs],
	);

	const createNewStartedLogForActivity = useWithClick((activity: Activity) => {
		createNewStartedLogFromActivity(activity);
	});

	const createNewStartedLogForActivityName = useWithClick(
		(options: { activityName: string; project: Project }) => {
			createNewStartedLogFromActivity({
				projectSlug: options.project.slug,
				name: options.activityName,
			});
		},
	);

	const stopAllProjects = useWithClick(() => {
		saveStartedLogs();
		setStartedLogs([]);
	});

	// TODO: Deprecate this
	const firstStartedProject = useMemo(() => {
		const projectSlug = startedLogs.at(0)?.projectSlug;
		if (!projectSlug) return;
		return getProjectBySlug(projectSlug);
	}, [getProjectBySlug, startedLogs]);

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

		addProjects(removeProjectDuplicates(filteredProjects));
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

		const projectLogs = _logs.filter((l) => l.projectSlug === project.slug);

		deleteLogs(projectLogs);
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
		stopAllProjects,
		addProject,
		removeAllProjectsAndLogs,
		removeAllLogs,
		importProjects,
		resetProject,
		removeProject,
		sortProjects,
		getProjectStartedLogs,
		removeLog,
		getProjectBySlug,
		createNewStartedLogForActivity,
		createNewStartedLogForActivityName,
		selectedDate,
		setSelectedDate,
		createProjectTracks,
		selectedDateIsToday,
		getProjectActivities,
		firstStartedProject,
		hasStartedLogs,
	};
}

export function DataProvider({ children }: PropsWithChildren) {
	const value = useDataProvider();
	return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
