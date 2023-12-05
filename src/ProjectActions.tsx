import {
	HiArrowPath,
	HiMinusCircle,
	HiClipboardDocumentList,
	HiPencil,
} from "react-icons/hi2";
import { Button } from "./Button";
import { ProjectAction, Project, projectActions, Interval } from "./types";
import {
	askForActivityName,
	cn,
	getLegend,
	logsTimeline,
	useDataContext,
	useWithClick,
} from "./utils";
import { ShowMoreDropdown } from "./ShowMoreDropdown";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useHotkeys } from "react-hotkeys-hook";
import { useMemo } from "react";

type ProjectActionsProps = {
	project: Project;
	actions: ProjectAction[];
	index: number;
	toggleActiveProject: (project: Project) => void;
	intervalMinutes: number;
	timelineLength: number;
	constraints: Interval;
};

type ProjectActionProps = {
	action: (project: Project) => void;
	icon: JSX.Element;
	disabled?: boolean;
};

export function ProjectActions(props: ProjectActionsProps) {
	const isSmallDevice = useMediaQuery("(max-width : 640px)");
	const {
		project,
		actions,
		index,
		toggleActiveProject,
		intervalMinutes,
		timelineLength,
		constraints,
	} = props;

	const {
		getProjectLogs,
		resetProject,
		removeProject,
		lastActivities,
		setLastActivities,
		getProjectStartedLogs,
	} = useDataContext();

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
		`${index}`,
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
				className={cn(isStarted ? "bg-red-500" : undefined)}
				disabled={ProjectActionsMapper[button].disabled}
			>
				{ProjectActionsMapper[button].icon}
			</Button>
		));
	};

	if (isSmallDevice && actions.length > 1) {
		return (
			<ShowMoreDropdown>
				{/* Render all the actions, no matter what is selected */}
				<div className="flex gap-2">{renderActions(projectActions)}</div>
			</ShowMoreDropdown>
		);
	} else {
		return <div className="flex gap-3">{renderActions(actions)}</div>;
	}
}
