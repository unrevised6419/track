import {
	Dispatch,
	SetStateAction,
	useCallback,
	useMemo,
	useState,
} from "react";
import {
	HiPauseCircle,
	HiPlayCircle,
	HiBars3BottomLeft,
} from "react-icons/hi2";
import { useLocalStorage } from "@uidotdev/usehooks";
import {
	usePlayClick,
	logsTimeline,
	getLogsConstraints,
	logToTextParts,
	askForActivityName,
	useSortableList,
	useDynamicFavicon,
	useProjectButtons,
	storageKey,
	isStartedProject,
	getProjectLogs,
} from "./utils";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { ProjectAction, Project, projectActions, Log, Interval } from "./types";
import { TotalInfo } from "./TotalInfo";
import { AddForm } from "./AddForm";
import { ProjectsLogs } from "./ProjectsLogs";
import { ProjectInfo } from "./ProjectInfo";
import { Modal } from "./Modal";
import { Checkbox } from "./Checkbox";
import { ReactSortable } from "react-sortablejs";
import { ProjectActions } from "./ProjectActions";
import { HeaderActions } from "./HeaderActions";

const rangeMinutes = 30;

const ProjectActionsSettingsProps: Record<ProjectAction, string> = {
	reset: "Project Time Reset",
	copy: "Project Log Copy",
	remove: "Project Remove",
	rename: "Rename Project Activity Name",
};

export function App() {
	const playClick = usePlayClick();
	const [projectButtons, toggleProjectButton] = useProjectButtons();
	const [showLogs, setShowLogs] = useState(false);
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [shouldAskForActivityName, setShouldAskForActivityName] =
		useLocalStorage(storageKey("should-ask-for-activity-name"), false);

	const [projects, setProjects] = useProjects();
	const [logs, setLogs] = useLocalStorage<Log[]>(
		storageKey("logs"),
		useMigrateOldLogs(projects),
	);

	const [sortableList, setSortableList] = useSortableList({
		projects,
		setProjects,
	});

	useDynamicFavicon(projects);

	const toggleActiveProject = useCallback(
		(project: Project) => {
			playClick();

			const startedProject = projects.find(isStartedProject);

			if (startedProject) {
				const newLog: Log = {
					projectSlug: startedProject.slug,
					interval: [startedProject.startedAt, Date.now()],
					activityName: shouldAskForActivityName
						? startedProject.lastActivityName ?? startedProject.name
						: startedProject.name,
				};

				setLogs([newLog, ...logs]);
			}

			const newProjects = projects.map((p) => {
				if (p.startedAt) {
					return {
						...p,
						startedAt: undefined,
						lastActivityName: shouldAskForActivityName
							? p.lastActivityName
							: undefined,
					} satisfies Project;
				} else if (p.slug === project.slug) {
					return { ...p, startedAt: Date.now() } satisfies Project;
				} else {
					return p;
				}
			});

			setProjects(newProjects);

			const newStartedProject = newProjects.find((p) => p.startedAt);

			if (newStartedProject) {
				setTimeout(() => {
					const activityName = shouldAskForActivityName
						? askForActivityName(newStartedProject.lastActivityName)
						: undefined;

					const newProject: Project = {
						...newStartedProject,
						lastActivityName: activityName || newStartedProject.name,
					};

					setProjects(
						newProjects.map((p) =>
							p.slug === newProject.slug ? newProject : p,
						),
					);
				}, 200);
			}
		},
		[playClick, projects, setProjects, shouldAskForActivityName, setLogs, logs],
	);

	async function onCopyLogs() {
		playClick();

		const { start, end } = getLogsConstraints(logs, projects);
		const projectsTimeline = projects
			.map((project) => {
				const projectLogs = getProjectLogs(project, logs);

				if (projectLogs.length === 0) return;

				const timeline = logsTimeline({
					start,
					end,
					logs: projectLogs,
					rangeMinutes,
				});
				return `${timeline} ${project.name} (${project.slug})`;
			})
			.filter(Boolean);

		const text = logs.map((log) => {
			const { timestamp, name, diffHuman } = logToTextParts(log);
			return `(${timestamp}) ${name} [${diffHuman}]`;
		});

		await navigator.clipboard.writeText(
			[projectsTimeline.join("\n"), "", text.join("\n")].join("\n"),
		);
	}

	return (
		<div className="container max-w-2xl border-x min-h-screen flex flex-col">
			<header className="py-3 flex items-center gap-4 ">
				<Badge badgeText="Jagaatrack" />
				<strong className="hidden sm:inline mt-0.5">
					Why are you running?
				</strong>
				<HeaderActions
					className="ml-auto"
					projects={projects}
					setProjects={setProjects}
					onShowSettingsModal={() => setShowSettingsModal(true)}
					logs={logs}
					setLogs={setLogs}
				/>
			</header>

			<TotalInfo projects={projects} logs={logs} />

			<AddForm projects={projects} setProjects={setProjects} />

			<ReactSortable
				tag="main"
				className="py-3 space-y-3"
				list={sortableList}
				setList={setSortableList}
				handle=".js-handle"
			>
				{projects.map((project, index) => (
					<article key={project.slug} className="flex gap-3">
						<Button
							className={project.startedAt ? "bg-red-500" : undefined}
							onClick={() => toggleActiveProject(project)}
						>
							{project.startedAt ? (
								<HiPauseCircle size={20} />
							) : (
								<HiPlayCircle size={20} />
							)}
						</Button>

						<div className="grow relative">
							<div className="absolute left-4 inset-y-0 items-center hidden sm:flex">
								<button className="js-handle">
									<HiBars3BottomLeft size={20} />
								</button>
							</div>
							<ProjectInfo project={project} logs={logs} />
							<div className="absolute right-4 inset-y-0 items-center hidden lg:flex">
								{index < 9 && (
									<kbd className="rounded-md bg-black text-xs font-mono text-white px-1.5 border border-jagaatrack">
										{index + 1}
									</kbd>
								)}
							</div>
						</div>

						<ProjectActions
							project={project}
							actions={projectButtons}
							projects={projects}
							setProjects={setProjects}
							index={index + 1}
							toggleActiveProject={toggleActiveProject}
							rangeMinutes={rangeMinutes}
							logs={logs}
							setLogs={setLogs}
						/>
					</article>
				))}
			</ReactSortable>

			<div className="flex gap-2">
				<button
					className="bg-gray-200 px-3 py-2 rounded-md mb-2 text-xs text-center font-bold flex justify-center items-center gap-3 grow"
					onClick={() => {
						playClick();
						setShowLogs(!showLogs);
					}}
				>
					{showLogs ? "Hide Logs" : "Show Logs"}
				</button>
				<button
					className="bg-gray-200 px-3 py-2 rounded-md mb-2 text-xs text-center font-bold flex justify-center items-center gap-3"
					onClick={onCopyLogs}
				>
					Copy Logs
				</button>
			</div>

			{showLogs && <ProjectsLogs logs={logs} />}

			<Modal active={showSettingsModal} setActive={setShowSettingsModal}>
				<div className="grid gap-2">
					<label>Actions</label>

					<div className="border px-2 rounded-md">
						<Checkbox
							item="Ask for activity name?"
							isChecked={shouldAskForActivityName}
							setIsChecked={setShouldAskForActivityName}
						/>
					</div>

					<label>Show Buttons</label>

					<div className="border px-2 rounded-md">
						{projectActions.map((button) => (
							<Checkbox
								key={button}
								item={ProjectActionsSettingsProps[button]}
								isChecked={projectButtons.includes(button)}
								setIsChecked={() => toggleProjectButton(button)}
							/>
						))}
					</div>
				</div>
			</Modal>
		</div>
	);
}

function useProjects() {
	const [projects, _setProjects] = useLocalStorage<Project[]>(
		storageKey("projects"),
		[],
	);

	// TODO: Remove migration after a while
	const setProjects: Dispatch<SetStateAction<Project[]>> = useCallback(
		function (value) {
			const voidTimes = (projects: Project[]) =>
				projects.map((p: Project) => ({ ...p, times: undefined }));

			if (typeof value !== "function") {
				_setProjects(voidTimes(value));
			} else {
				_setProjects((projects) => voidTimes(value(projects)));
			}
		},
		[_setProjects],
	);

	return [projects, setProjects] as const;
}

// TODO: Remove migration after a while
type OldProject = Project & {
	times?: Array<{
		projectSlug: string;
		activityName: string;
		startedAt: number;
		endedAt: number;
	}>;
};
function useMigrateOldLogs(projects: OldProject[]) {
	return useMemo(() => {
		const oldLogs = projects
			.flatMap((project) => {
				return (project.times ?? []).map((t) => ({
					...t,
					projectSlug: project.slug,
					activityName: t.activityName || project.name,
				}));
			})
			.sort((t1, t2) => t2.endedAt - t1.endedAt);

		return oldLogs.map((log) => ({
			projectSlug: log.projectSlug,
			activityName: log.activityName,
			interval: [log.startedAt, log.endedAt] as Interval,
		}));
	}, [projects]);
}
