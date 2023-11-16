import { useCallback, useEffect, useState } from "react";
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
	projectToTimestamps,
	projectsToLogs,
	logToTextParts,
	isFocusable,
	askForProjectActivityName,
	useSortableList,
	useDynamicFavicon,
} from "./utils";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { ProjectAction, Project, Time, projectActions } from "./types";
import { TotalInfo } from "./TotalInfo";
import { AddForm } from "./AddForm";
import { ProjectsLogs } from "./ProjectsLogs";
import { ProjectInfo } from "./ProjectInfo";
import { Modal } from "./Modal";
import { Checkbox } from "./Checkbox";
import { ReactSortable } from "react-sortablejs";
import { ProjectActions } from "./ProjectActions";
import { HeaderActions } from "./HeaderActions";

const askForActivityNameStorageKey = "jagaatrack:should-ask-for-activity-name";
const projectEndButtonsStorageKey = "jagaatrack:project-end-buttons";
const projectsStorageKey = "jagaatrack:projects";

const ProjectActionsSettingsProps: Record<ProjectAction, string> = {
	reset: "Project Time Reset",
	copy: "Project Log Copy",
	remove: "Project Remove",
	rename: "Rename Project Activity Name",
};

export function App() {
	const playClick = usePlayClick();
	const [projects, setProjects] = useLocalStorage<Project[]>(
		projectsStorageKey,
		[],
	);
	const [sortableList, setSortableList] = useSortableList({
		projects,
		setProjects,
	});
	const [showLogs, setShowLogs] = useState(false);
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [shouldAskForActivityName, setShouldAskForActivityName] =
		useLocalStorage(askForActivityNameStorageKey, false);

	const [projectEndButtons, _setProjectEndButtons] = useLocalStorage<
		ProjectAction[]
	>(projectEndButtonsStorageKey, ["copy", "rename"]);

	useDynamicFavicon(projects);

	function toggleProjectEndButton(button: ProjectAction) {
		const newButtons = projectEndButtons.includes(button)
			? projectEndButtons.filter((e) => e !== button)
			: [...projectEndButtons, button];

		_setProjectEndButtons([...new Set(newButtons)]);
	}

	const toggleActiveProject = useCallback(
		(project: Project) => {
			playClick();

			const newProject = projects.map((e) => {
				if (e.startedAt) {
					const newLog: Time = {
						startedAt: e.startedAt,
						endedAt: Date.now(),
						activityName: shouldAskForActivityName
							? e.lastActivityName || project.name
							: e.name,
					};

					const newProject: Project = {
						...e,
						times: [...e.times, newLog],
						startedAt: undefined,
						lastActivityName: shouldAskForActivityName
							? e.lastActivityName
							: undefined,
					};

					return newProject;
				}

				if (e.slug === project.slug) {
					// TODO: Don't like this, needs to be outside `map`
					const activityName = shouldAskForActivityName
						? askForProjectActivityName(e)
						: undefined;

					const newProject: Project = {
						...e,
						startedAt: Date.now(),
						lastActivityName: activityName,
					};
					return newProject;
				}

				return e;
			});

			setProjects(newProject);
		},
		[shouldAskForActivityName, projects, playClick, setProjects],
	);

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.code === "Escape" && isFocusable(document.activeElement)) {
				document.activeElement.blur();
			}
		}

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, []);

	useEffect(() => {
		function onKeyPress(e: KeyboardEvent) {
			if (document.activeElement !== document.body) return;

			const maybeDigit = Number(e.key);
			if (Number.isNaN(maybeDigit)) return;

			const project = projects[maybeDigit - 1];
			if (!project) return;

			toggleActiveProject(project);
		}

		document.addEventListener("keypress", onKeyPress);
		return () => document.removeEventListener("keypress", onKeyPress);
	}, [toggleActiveProject, projects]);

	async function onCopyLogs() {
		playClick();

		const minutes = 30;
		const validProjects = projects.filter((p) => p.times.length !== 0);
		const { start, end } = getLogsConstraints(validProjects);

		const projectsTimeline = validProjects.map((project) => {
			const timestamps = projectToTimestamps(project, minutes);
			const timeline = logsTimeline({ start, end, timestamps, minutes });
			return `${timeline} ${project.name} (${project.slug})`;
		});

		const logs = projectsToLogs(projects, { sortByTime: false });
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
				/>
			</header>

			<TotalInfo projects={projects} />

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
							actions={projectEndButtons}
							projects={projects}
							setProjects={setProjects}
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

			{showLogs && <ProjectsLogs projects={projects} />}

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
								isChecked={projectEndButtons.includes(button)}
								setIsChecked={() => toggleProjectEndButton(button)}
							/>
						))}
					</div>
				</div>
			</Modal>
		</div>
	);
}
