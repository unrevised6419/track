import {
	Dispatch,
	PropsWithChildren,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	HiPauseCircle,
	HiPlayCircle,
	HiMinusCircle,
	HiClipboardDocument,
	HiClock,
	HiTrash,
	HiFolderPlus,
	HiArrowPath,
	HiCog8Tooth,
	HiBars3BottomLeft,
	HiClipboardDocumentList,
} from "react-icons/hi2";
import { useFavicon, useLocalStorage } from "@uidotdev/usehooks";
import {
	cn,
	sum,
	usePlayClick,
	logsTimeline,
	getLogsConstraints,
	projectToTimestamps,
	projectToLogs,
	projectsToLogs,
	logToTextParts,
} from "./utils";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Project, Time } from "./types";
import { TotalInfo } from "./TotalInfo";
import { AddForm } from "./AddForm";
import { ProjectsLogs } from "./ProjectsLogs";
import { ProjectInfo } from "./ProjectInfo";
import { Modal } from "./Modal";
import { Checkbox } from "./Checkbox";
import { ItemInterface, ReactSortable } from "react-sortablejs";

const faviconPlay = "/favicon-play.svg";
const faviconPause = "/favicon-pause.svg";

const askForActivityNameStorageKey = "jagaatrack:should-ask-for-activity-name";
const projectEndButtonsStorageKey = "jagaatrack:project-end-buttons";

type EndButton = "reset" | "remove" | "copy";

export function App() {
	const playClick = usePlayClick();
	const [projects, setProjects] = useProjects();
	const [sortableList, setSortableList] = useSortableList({
		projects,
		setProjects,
	});
	const playing = useMemo(() => projects.some((e) => e.startedAt), [projects]);
	const [favicon, setFavicon] = useState(playing ? faviconPlay : faviconPause);
	const [showLogs, setShowLogs] = useState(false);
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [shouldAskForActivityName, setShouldAskForActivityName] =
		useLocalStorage(askForActivityNameStorageKey, false);

	const [projectEndButtons, _setProjectEndButtons] = useLocalStorage<
		EndButton[]
	>(projectEndButtonsStorageKey, ["reset", "copy"]);

	function toggleProjectEndButton(button: EndButton) {
		const newButtons = projectEndButtons.includes(button)
			? projectEndButtons.filter((e) => e !== button)
			: [...projectEndButtons, button];

		_setProjectEndButtons([...new Set(newButtons)]);
	}

	useFavicon(favicon);

	useEffect(() => {
		setFavicon(playing ? faviconPlay : faviconPause);
	}, [playing]);

	function removeProject(project: Project) {
		playClick();
		const newProjects = projects.filter((e) => e.slug !== project.slug);
		setProjects(newProjects);
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

	async function onExport() {
		playClick();

		const date = new Date().toISOString().split("T").at(0) as string;

		const filteredProjects = projects.filter(
			(e) => e.times.length > 0 || e.startedAt,
		);

		const projectsExports = filteredProjects.map((project) => {
			const durations = project.times.map((e) => e.endedAt - e.startedAt);

			if (project.startedAt) {
				const lastDuration = Date.now() - project.startedAt;
				durations.push(lastDuration);
			}

			const totalTimeS = sum(durations) / 1000;
			const totalTimeMinutes = Math.ceil(totalTimeS / 60);
			const totalTimeHours = totalTimeMinutes / 60;
			const totalTime = totalTimeHours.toFixed(2);

			return `/track ${date} ${project.slug} ${totalTime} TODO ${project.name}`;
		});

		await navigator.clipboard.writeText(projectsExports.join("\n"));

		window.alert("Jagaad Manager Export format was copied to clipboard!");
	}

	function onResetTimers() {
		playClick();

		const shouldReset = window.confirm(
			"Are you sure you want to reset all timers?",
		);

		if (!shouldReset) return;

		const newProjects = projects.map<Project>((e) => ({
			...e,
			times: [],
			startedAt: undefined,
		}));

		setProjects(newProjects);
	}

	function onFullReset() {
		playClick();

		const shouldReset = window.confirm(
			"Are you sure you want to reset everything?",
		);

		if (!shouldReset) return;

		setProjects([]);
	}

	function onImport() {
		playClick();

		const text = window.prompt("Paste the Jagaad Manager `/projects me` here");

		if (!text) return;

		const lines = text
			.split("\n")
			.map((line) => line.split("] - ").at(0)?.split("• ").at(-1)?.trim())
			.filter(Boolean);

		const newProjects = lines.map<Project>((line) => {
			const [name, slug] = line.split(" [");

			return {
				slug,
				name,
				times: [],
				startedAt: undefined,
			} satisfies Project;
		});

		const filteredProjects = newProjects.filter(
			(p) => !projects.some((e) => e.slug === p.slug),
		);

		setProjects([...projects, ...filteredProjects]);
	}

	function resetProject(project: Project) {
		playClick();

		const newProjects = projects.map((p) => {
			if (p.slug === project.slug) {
				return { ...p, times: [], startedAt: undefined };
			}

			return p;
		});

		setProjects(newProjects);
	}

	async function copyProjectLog(project: Project) {
		playClick();

		const minutes = 30;
		const validProjects = projects.filter((p) => p.times.length !== 0);
		const { start, end } = getLogsConstraints(validProjects);
		const timestamps = projectToTimestamps(project, minutes);
		const timeline = logsTimeline({ start, end, timestamps, minutes });
		const logs = projectToLogs(project, { sortByTime: true });
		const activities = logs
			.map((l) => l.activityName)
			.filter((a) => a !== project.name);

		const uniqueActivities = [...new Set(activities)];

		const log = [
			`${project.name} (${project.slug})\n`,
			uniqueActivities.map((a) => `- ${a}`).join("\n"),
			`\nIntervals of ${minutes} minutes.`,
			timeline,
		].join("\n");

		await navigator.clipboard.writeText(log);
	}

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
				<div className="ml-auto flex gap-2">
					<HeaderButton onClick={onFullReset} title="Full Reset">
						<HiTrash className="w-6 h-6 sm:w-6 sm:h-6" />
					</HeaderButton>
					<HeaderButton onClick={onResetTimers} title="Reset Timers">
						<HiClock className="w-6 h-6 sm:w-6 sm:h-6" />
					</HeaderButton>
					<HeaderButton onClick={onImport} title="Import JM Projects">
						<HiFolderPlus className="w-6 h-6 sm:w-6 sm:h-6" />
					</HeaderButton>
					<HeaderButton onClick={onExport} title="Export JM Format">
						<HiClipboardDocument className="w-6 h-6 sm:w-6 sm:h-6" />
					</HeaderButton>
					<HeaderButton
						onClick={() => setShowSettingsModal(true)}
						title="Open Settings Modal"
					>
						<HiCog8Tooth className="w-6 h-6 sm:w-6 sm:h-6" />
					</HeaderButton>
				</div>
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
					<article key={project.slug} className="flex gap-3 items-stretch">
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

						{projectEndButtons.includes("reset") && (
							<Button
								onClick={() => resetProject(project)}
								className={cn(project.startedAt ? "bg-red-500" : undefined)}
							>
								<HiArrowPath size={20} />
							</Button>
						)}

						{projectEndButtons.includes("remove") && (
							<Button
								onClick={() => removeProject(project)}
								className={project.startedAt ? "bg-red-500" : undefined}
							>
								<HiMinusCircle size={20} />
							</Button>
						)}

						{projectEndButtons.includes("copy") && (
							<Button
								onClick={() => copyProjectLog(project)}
								className={project.startedAt ? "bg-red-500" : undefined}
							>
								<HiClipboardDocumentList size={20} />
							</Button>
						)}
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
						<Checkbox
							item="Project Time Reset"
							isChecked={projectEndButtons.includes("reset")}
							setIsChecked={() => toggleProjectEndButton("reset")}
						/>
						<Checkbox
							item="Project Log Copy"
							isChecked={projectEndButtons.includes("copy")}
							setIsChecked={() => toggleProjectEndButton("copy")}
						/>
						<Checkbox
							item="Project Remove"
							isChecked={projectEndButtons.includes("remove")}
							setIsChecked={() => toggleProjectEndButton("remove")}
						/>
					</div>
				</div>
			</Modal>
		</div>
	);
}

type HeaderButtonProps = PropsWithChildren<{
	onClick: () => void;
	title?: string;
}>;

function HeaderButton(props: HeaderButtonProps) {
	return (
		<button
			onClick={props.onClick}
			className="p-1.5 sm:p-3 bg-gray-200 rounded-md hover:bg-gray-300 transition-all"
			title={props.title}
		>
			{props.children}
		</button>
	);
}

function askForProjectActivityName(project: Project) {
	const userAnswer = window.prompt(
		"What are you working on?",
		project.lastActivityName,
	);

	return userAnswer || undefined;
}

function useProjects() {
	// TODO: Remove migration after a while
	const [migratingProjects, setMigratingProjects] = useLocalStorage<Project[]>(
		"entries",
		[],
	);

	const state = useLocalStorage<Project[]>(
		"jagaatrack:projects",
		migratingProjects,
	);

	useEffect(() => {
		// Clear old stored projects after initial migration
		setMigratingProjects([]);
	}, [setMigratingProjects]);

	return state;
}

function useSortableList({
	projects,
	setProjects,
}: {
	projects: Project[];
	setProjects: Dispatch<SetStateAction<Project[]>>;
}) {
	const projectsList = useMemo<ItemInterface[]>(
		() => projects.map((p) => ({ id: p.slug })),
		[projects],
	);
	const setProjectsList = useCallback(
		(list: ItemInterface[]) => {
			const newProjects = list.map((item) =>
				projects.find((p) => p.slug === item.id),
			);

			setProjects(newProjects as Project[]);
		},
		[projects, setProjects],
	);

	return [projectsList, setProjectsList] as const;
}

type FocusableElements =
	| HTMLInputElement
	| HTMLTextAreaElement
	| HTMLButtonElement
	| HTMLSelectElement
	| HTMLAnchorElement;

function isFocusable(element: Element | null): element is FocusableElements {
	const elements = ["INPUT", "TEXTAREA", "BUTTON", "SELECT", "A"];
	return elements.includes(element?.tagName as string);
}
