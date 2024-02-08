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
	askForActivityName,
	cn,
	getLegend,
	logsTimeline,
	msToHumanFormat,
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
}: ProjectRowProps) {
	const isSmallDevice = useMediaQuery("(max-width : 640px)");

	const {
		getProjectLogs,
		resetProject,
		removeProject,
		lastActivities,
		setLastActivities,
		getProjectStartedLogs,
		toggleActiveProject,
	} = useDataContext();

	const localProjects = useMemo(() => [project], [project]);
	const totalTime = useLiveTotalTime(localProjects);
	const totalTimeHuman = useMemo(() => msToHumanFormat(totalTime), [totalTime]);

	const projectLogs = getProjectLogs(project);
	const isStarted = useMemo(
		() => getProjectStartedLogs(project).length > 0,
		[getProjectStartedLogs, project],
	);

	const onResetProject = useWithClick(resetProject);
	const onRemoveProject = useWithClick(removeProject);
	const onRenameProjectActivity = useWithClick((project: Project) => {
		const activityName = askForActivityName(lastActivities[project.slug]);

		if (activityName) {
			setLastActivities({
				...lastActivities,
				[project.slug]: activityName,
			});
		}
	});

	const onCopyProjectLog = useWithClick((project: Project) => {
		const timeline = logsTimeline({
			constraints,
			logs: projectLogs,
			intervalMinutes,
			timelineLength,
		});

		const activities = projectLogs
			.map((l) => l.activityName)
			.filter((a) => a !== project.name);

		const uniqueActivities = [...new Set(activities)];

		const log = [
			uniqueActivities.map((a) => `- ${a}`).join("\n"),
			"",
			timeline,
			getLegend(intervalMinutes),
		].join("\n");

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
			action: onRemoveProject,
			icon: <HiMinusCircle size={20} />,
		},
		reset: {
			action: onResetProject,
			icon: <HiArrowPath size={20} />,
			disabled: projectLogs.length === 0,
		},
		rename: {
			action: onRenameProjectActivity,
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

			<div className="relative grow">
				<div className="absolute inset-y-0 left-2 hidden items-center sm:flex">
					<button
						className={cn("js-handle p-2", isStarted && "text-error-content")}
					>
						<HiBars3BottomLeft />
					</button>
				</div>
				<input
					value={`(${totalTimeHuman}) ${project.name}, ${project.slug}`}
					onChange={() => {}}
					readOnly
					placeholder=""
					className={cn(
						"input input-bordered w-full font-mono sm:pl-10 lg:pr-12",
						isStarted ? "input-error bg-error text-error-content" : undefined,
						!totalTime ? "text-base-content/40" : undefined,
					)}
				/>
				<div className="absolute inset-y-0 right-4 hidden items-center lg:flex">
					{order <= 9 && (
						<kbd className="kbd kbd-sm border-primary">{order}</kbd>
					)}
				</div>
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
