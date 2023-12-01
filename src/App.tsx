import { useCallback, useState } from "react";
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
	getLegend,
} from "./utils";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { ProjectAction, Project, projectActions, Log } from "./types";
import { TotalInfo } from "./TotalInfo";
import { AddForm } from "./AddForm";
import { ProjectsLogs } from "./ProjectsLogs";
import { ProjectInfo } from "./ProjectInfo";
import { Modal } from "./Modal";
import { Checkbox } from "./Checkbox";
import { ReactSortable } from "react-sortablejs";
import { ProjectActions } from "./ProjectActions";
import { HeaderActions } from "./HeaderActions";
import { useAppContext } from "./AppProvider";

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

	const { projects, setProjects, logs, setLogs, getProjectLogs } =
		useAppContext();
	const [sortableList, setSortableList] = useSortableList();

	useDynamicFavicon();

	const constraints = getLogsConstraints(logs, projects);
	const timelineLength = 32;
	const diff = constraints[1] - constraints[0];
	const intervalMinutes = Math.ceil(diff / timelineLength / 1000 / 60);

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

		const projectsTimeline = projects
			.map((project) => {
				const projectLogs = getProjectLogs(project);

				if (projectLogs.length === 0) return;

				const timeline = logsTimeline({
					constraints,
					logs: projectLogs,
					intervalMinutes,
					timelineLength,
				});
				return `${timeline} ${project.name} (${project.slug})`;
			})
			.filter(Boolean);

		const text = logs.map((log) => {
			const { timestamp, name, diffHuman } = logToTextParts(log);
			return `(${timestamp}) ${name} [${diffHuman}]`;
		});

		await navigator.clipboard.writeText(
			[
				projectsTimeline.join("\n"),
				`${getLegend(intervalMinutes)}\n`,
				text.join("\n"),
			].join("\n"),
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
					onShowSettingsModal={() => setShowSettingsModal(true)}
				/>
			</header>

			<TotalInfo />
			<AddForm />

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
							<ProjectInfo project={project} />
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
							index={index + 1}
							toggleActiveProject={toggleActiveProject}
							intervalMinutes={intervalMinutes}
							timelineLength={timelineLength}
							constraints={constraints}
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

			{showLogs && <ProjectsLogs />}

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

					<div className="border font-mono text-xs flex gap-1 items-center justify-center p-1 rounded">
						<span>{import.meta.env.VITE_BUILD_HASH}</span>
						<span>:</span>
						<span>{import.meta.env.VITE_BUILD_TIME}</span>
					</div>
				</div>
			</Modal>
		</div>
	);
}
