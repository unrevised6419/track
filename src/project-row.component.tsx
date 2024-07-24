import {
	HiPauseCircle,
	HiPlayCircle,
	HiBars3BottomLeft,
	HiArrowPath,
	HiClipboardDocumentList,
	HiMinusCircle,
} from "react-icons/hi2";
import { Button } from "./button.component";
import { Project, ProjectAction, projectActions } from "./types";
import {
	cn,
	msToHumanFormat,
	useLiveTotalTime,
	useKeyIsPressed,
	useWithClick,
} from "./utils";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useMemo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { ShowMoreDropdown } from "./show-more-dropdown.component";
import { useDataContext } from "./data.context";
import { useCommandMenuContext } from "./command-menu.context";

type ProjectRowProps = {
	project: Project;
	projectButtons: ProjectAction[];
	order: number;
	showOrderButton: boolean;
};

type ProjectActionProps = {
	key: ProjectAction;
	action: (project: Project) => void;
	icon: JSX.Element;
	disabled?: boolean;
};

export function ProjectRow({
	project,
	projectButtons: actions,
	order,
	showOrderButton,
}: ProjectRowProps) {
	const isSmallDevice = useMediaQuery("(max-width : 768px)");
	const shiftKeyIsPressed = useKeyIsPressed("Shift");

	const {
		getProjectLogs,
		resetProject,
		removeProject,
		getProjectStartedLogs,
		createProjectTracks,
		selectedDateIsToday,
	} = useDataContext();

	const { toggleCommandMenuForProject, showCommandMenuForProject } =
		useCommandMenuContext();

	const projectLogs = getProjectLogs(project);
	const projectStartedLogs = getProjectStartedLogs(project);

	const isStarted = projectStartedLogs.length > 0;
	const isNotStarted = projectStartedLogs.length === 0;
	const startedLogsTitles = (projectStartedLogs.at(-1) ?? projectLogs.at(-1))
		?.activityName;

	const onCopyProjectLog = useWithClick((project: Project) => {
		const tracks = createProjectTracks(project);
		void navigator.clipboard.writeText(tracks.join("\n\n"));
	});

	const canBeToggled = selectedDateIsToday || isStarted;

	useHotkeys(
		order.toString(),
		(event) => {
			// If not prevented the character will reach command input
			event.preventDefault();
			toggleCommandMenuForProject(project);
		},
		{ enabled: canBeToggled },
		[project],
	);

	useHotkeys(
		`shift+${String(order)}`,
		(event) => {
			// If not prevented the character will reach command input
			event.preventDefault();
			showCommandMenuForProject(project);
		},
		{ enabled: canBeToggled },
		[project],
	);

	const ProjectActionsMapper: Record<ProjectAction, ProjectActionProps> = {
		copy: {
			key: "copy",
			action: onCopyProjectLog,
			icon: <HiClipboardDocumentList size={20} />,
			disabled: projectLogs.length === 0,
		},
		remove: {
			key: "remove",
			action: (project) => {
				const message = `Are you sure you want to remove ${project.name} and all its logs?`;
				if (globalThis.confirm(message)) removeProject(project);
			},
			icon: <HiMinusCircle size={20} />,
		},
		reset: {
			key: "reset",
			action: (project) => {
				const message = `Are you sure you want to remove all logs for ${project.name}?`;
				if (globalThis.confirm(message)) resetProject(project);
			},
			icon: <HiArrowPath size={20} />,
			disabled: projectLogs.length === 0,
		},
	};

	const renderActions = (actions: ReadonlyArray<ProjectAction>) => {
		return actions
			.map((button) => ProjectActionsMapper[button])
			.filter(Boolean)
			.map((options) => {
				return (
					<Button
						key={options.key}
						onClick={() => {
							options.action(project);
						}}
						className={cn(isStarted ? "btn-error" : undefined)}
						disabled={options.disabled}
					>
						{options.icon}
					</Button>
				);
			});
	};

	return (
		<article key={project.slug} className="flex gap-3">
			<Button
				className={isStarted ? "btn-error" : undefined}
				disabled={!canBeToggled}
				onClick={() => {
					if (isNotStarted || shiftKeyIsPressed) {
						showCommandMenuForProject(project);
					} else {
						toggleCommandMenuForProject(project);
					}
				}}
			>
				{isNotStarted || shiftKeyIsPressed ? (
					<HiPlayCircle size={20} />
				) : (
					<HiPauseCircle size={20} />
				)}
			</Button>

			<div className="relative min-w-0 grow">
				<ProjectInput
					project={project}
					isStarted={isStarted}
					showOrderButton={showOrderButton}
					activityName={startedLogsTitles}
				/>

				{showOrderButton && (
					<div className="absolute inset-y-0 left-2 flex items-center">
						<button
							className={cn("js-handle p-2", isStarted && "text-error-content")}
						>
							<HiBars3BottomLeft />
						</button>
					</div>
				)}

				{canBeToggled && order <= 9 && (
					<div className="absolute inset-y-0 right-4 hidden items-center lg:flex">
						<kbd className="kbd kbd-sm border-primary">{order}</kbd>
					</div>
				)}
			</div>

			{isSmallDevice && actions.length > 1 ? (
				<ShowMoreDropdown>
					{/* Render all the actions, no matter what is selected */}
					<div className="flex gap-2">{renderActions(projectActions)}</div>
				</ShowMoreDropdown>
			) : (
				<div className="flex gap-3">{renderActions(actions)}</div>
			)}
		</article>
	);
}

type ProjectInputProps = {
	project: Project;
	isStarted: boolean;
	showOrderButton: boolean;
	activityName?: string;
};

function ProjectInput({
	project,
	isStarted,
	showOrderButton,
	activityName,
}: ProjectInputProps) {
	const localProjects = useMemo(() => [project], [project]);
	const totalTime = useLiveTotalTime(localProjects);
	const totalTimeHuman = useMemo(() => msToHumanFormat(totalTime), [totalTime]);

	return (
		<div
			className={cn(
				"relative flex h-12 items-center gap-2 rounded-btn border border-base-content/20 bg-base-100 px-4 font-mono lg:pr-12",
				showOrderButton ? "pl-10" : undefined,
				isStarted ? "bg-error text-error-content" : undefined,
				totalTime === 0 ? "text-base-content/40" : undefined,
			)}
		>
			<div>({totalTimeHuman})</div>
			<div className="overflow-hidden text-xs">
				<div className="truncate pt-0.5">
					{project.name}, {project.slug}
				</div>
				<div className="truncate font-sans opacity-50">
					{activityName ?? "No activity"}
				</div>
			</div>
		</div>
	);
}
