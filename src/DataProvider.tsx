import { useLocalStorage } from "@uidotdev/usehooks";
import {
	Dispatch,
	PropsWithChildren,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
} from "react";
import { Log, Project, StartedLog } from "./types";
import {
	askForActivityName,
	groupBy,
	storageKey,
	useEffectEvent,
	useWithClick,
} from "./utils";
import { DataContext } from "./data-context";

export function DataProvider({ children }: PropsWithChildren) {
	const [shouldAskForActivityName, setShouldAskForActivityName] =
		useLocalStorage(storageKey("should-ask-for-activity-name"), false);
	const [_logs, _setLogs] = useLocalStorage<ReadonlyArray<Log>>(
		storageKey("logs"),
		[],
	);

	// TODO: Remove temporary later
	const newLogsMapper = (logs: readonly Log[]): readonly Log[] => {
		return logs.map((l) => ({
			...l,
			...(l.interval && {
				startedAt: l.interval[0],
				endedAt: l.interval[1],
				interval: undefined,
			}),
		}));
	};
	const logs = useMemo(() => newLogsMapper(_logs), [_logs]);
	const setLogs: Dispatch<SetStateAction<readonly Log[]>> = useCallback(
		(value) => {
			if (typeof value === "function") {
				_setLogs((prev) => value(newLogsMapper(prev)));
			} else {
				_setLogs(newLogsMapper(value));
			}
		},
		[_setLogs],
	);
	useEffect(() => {
		console.log("Migrating logs");
		_setLogs(newLogsMapper);
	}, [_setLogs]);

	const [projects, setProjects] = useLocalStorage<ReadonlyArray<Project>>(
		storageKey("projects"),
		[],
	);
	const [startedLogs, setStartedLogs] = useLocalStorage<readonly StartedLog[]>(
		storageKey("started-logs"),
		[],
	);

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

	const toggleActiveProject = useWithClick((project: Project) => {
		const newLogs = startedLogs.map<Log>((log) => ({
			projectSlug: log.projectSlug,
			startedAt: log.startedAt,
			endedAt: Date.now(),
			activityName: lastActivities[log.projectSlug] ?? log.activityName,
		}));

		const projectHasStartedLog = startedLogs.some(
			(l) => l.projectSlug === project.slug,
		);

		if (projectHasStartedLog) {
			setStartedLogs([]);
		} else {
			const startedAt = Date.now();

			const previousActivityName = lastActivities[project.slug] ?? project.name;
			const activityName = shouldAskForActivityName
				? askForActivityName(previousActivityName) ?? project.name
				: project.name;

			const startLog: StartedLog = {
				projectSlug: project.slug,
				startedAt,
				activityName,
			};

			setStartedLogs([startLog]);
			setLastActivities({
				...lastActivities,
				[project.slug]: activityName,
			});
		}

		setLogs([...newLogs, ...logs]);
	});

	const addProject = useEffectEvent((project: Project) => {
		setProjects([project, ...projects]);
	});

	const removeAllProjectsAndLogs = useEffectEvent(() => {
		setProjects([]);
		setLogs([]);
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

	const resetProject = useEffectEvent((project: Project) => {
		const newLogs = logs.filter((l) => l.projectSlug !== project.slug);
		const newStartedLogs = startedLogs.filter(
			(l) => l.projectSlug !== project.slug,
		);

		setLogs(newLogs);
		setStartedLogs(newStartedLogs);
	});

	const removeProject = useEffectEvent((project: Project) => {
		const newProjects = projects.filter((e) => e.slug !== project.slug);
		const newLogs = logs.filter((l) => l.projectSlug !== project.slug);
		setProjects(newProjects);
		setLogs(newLogs);
	});

	const sortProjects = useEffectEvent((slugs: ReadonlyArray<string>) => {
		const newProjects = slugs
			.map((slug) => projects.find((p) => p.slug === slug))
			.filter(Boolean);

		setProjects(newProjects);
	});

	return (
		<DataContext.Provider
			value={{
				projects,
				logs,
				startedLogs,
				shouldAskForActivityName,
				setProjects,
				setLogs,
				getProjectLogs,
				setShouldAskForActivityName,
				toggleActiveProject,
				addProject,
				removeAllProjectsAndLogs,
				removeAllLogs,
				addProjects,
				resetProject,
				removeProject,
				sortProjects,
				lastActivities,
				setLastActivities,
				getProjectStartedLogs,
			}}
		>
			{children}
		</DataContext.Provider>
	);
}
