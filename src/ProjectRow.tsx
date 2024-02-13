import {
	HiPauseCircle,
	HiPlayCircle,
	HiBars3BottomLeft,
	HiArrowPath,
	HiClipboardDocumentList,
	HiMinusCircle,
	HiPencil,
} from "react-icons/hi2";
import { Button } from "./Button";
import { Interval, Project, ProjectAction, projectActions } from "./types";
import {
	cn,
	getDateString,
	getLegend,
	groupBy,
	logsTimeline,
	logsToMachineTimeInHours,
	msToHumanFormat,
	startedLogToLog,
	sumLogs,
	useDataContext,
	useLiveTotalTime,
	useWithClick,
} from "./utils";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useMemo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { ShowMoreDropdown } from "./ShowMoreDropdown";

type ProjectRowProps = {
	project: Project;
	projectButtons: ProjectAction[];
	intervalMinutes: number;
	timelineLength: number;
	constraints: Interval;
	order: number;
	showOrderButton: boolean;
};

type ProjectActionProps = {
	action: (project: Project) => void;
	icon: JSX.Element;
	disabled?: boolean;
};

export function ProjectRow({
	project,
	projectButtons: actions,
	intervalMinutes,
	timelineLength,
	constraints,
	order,
	showOrderButton,
}: ProjectRowProps) {
	const isSmallDevice = useMediaQuery("(max-width : 768px)");

	const {
		getProjectLogs,
		resetProject,
		removeProject,
		getProjectStartedLogs,
		toggleActiveProject,
		renameProjectActivity,
	} = useDataContext();

	const projectLogs = getProjectLogs(project);
	const projectStartedLogs = getProjectStartedLogs(project);

	const isStarted = projectStartedLogs.length > 0;
	const startedLogsTitles = (projectStartedLogs.at(-1) ?? projectLogs.at(-1))
		?.activityName;

	const onCopyProjectLog = useWithClick((project: Project) => {
		const logs = [
			...getProjectLogs(project),
			...getProjectStartedLogs(project).map(startedLogToLog),
		];

		const timeline = logsTimeline({
			constraints,
			logs,
			intervalMinutes,
			timelineLength,
		});

		const groupByActivity = Object.entries(groupBy(logs, "activityName"));
		const activities = groupByActivity.map(([name, logs = []]) => {
			const totalTime = sumLogs(logs);
			const totalTimeHuman = msToHumanFormat(totalTime, "units");

			return `${name} (${totalTimeHuman} / x${logs.length})`;
		});

		const date = getDateString(new Date());
		const totalTimeHours = logsToMachineTimeInHours(logs);
		const totalTime = totalTimeHours.toFixed(2);

		const log = [
			`/track ${date} ${project.slug} ${totalTime} ${activities.map((a) => `- ${a}`).join("\n")}`,
			"",
			"Timeline temporary disabled due to server issues.",
			timeline,
			getLegend(intervalMinutes),
		]
			// TODO: Temporary disable emoji until server handles them corectly
			.slice(0, -2)
			.join("\n");

		void navigator.clipboard.writeText(log);
	});

	useHotkeys(
		`${order}`,
		() => {
			toggleActiveProject(project);
		},
		[project],
	);

	const ProjectActionsMapper: Record<ProjectAction, ProjectActionProps> = {
		copy: {
			action: onCopyProjectLog,
			icon: <HiClipboardDocumentList size={20} />,
			disabled: projectLogs.length === 0,
		},
		remove: {
			action: removeProject,
			icon: <HiMinusCircle size={20} />,
		},
		reset: {
			action: resetProject,
			icon: <HiArrowPath size={20} />,
			disabled: projectLogs.length === 0,
		},
		rename: {
			action: renameProjectActivity,
			icon: <HiPencil size={20} />,
		},
	};

	const renderActions = (actions: ReadonlyArray<ProjectAction>) => {
		return actions.map((button) => (
			<Button
				key={button}
				onClick={() => {
					ProjectActionsMapper[button].action(project);
				}}
				className={cn(isStarted ? "btn-error" : undefined)}
				disabled={ProjectActionsMapper[button].disabled}
			>
				{ProjectActionsMapper[button].icon}
			</Button>
		));
	};

	return (
		<article key={project.slug} className="flex gap-3">
			<Button
				className={isStarted ? "btn-error" : undefined}
				onClick={() => {
					toggleActiveProject(project);
				}}
			>
				{isStarted ? <HiPauseCircle size={20} /> : <HiPlayCircle size={20} />}
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

				{order <= 9 && (
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
