import {
	HiArrowPath,
	HiMinusCircle,
	HiClipboardDocumentList,
	HiPencil,
} from "react-icons/hi2";
import { Button } from "./Button";
import { ProjectAction, Project, projectActions } from "./types";
import {
	askForActivityName,
	cn,
	getLogsConstraints,
	logsTimeline,
	projectToLogs,
	projectToTimestamps,
	usePlayClick,
} from "./utils";
import { Dispatch, SetStateAction } from "react";
import { ShowMoreDropdown } from "./ShowMoreDropdown";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useHotkeys } from "react-hotkeys-hook";

type ProjectActionsProps = {
	project: Project;
	projects: Project[];
	setProjects: Dispatch<SetStateAction<Project[]>>;
	actions: ProjectAction[];
	index: number;
	toggleActiveProject: (project: Project) => void;
	minutes: number;
};

type ProjectActionProps = {
	action: (project: Project) => void;
	icon: JSX.Element;
	disabled?: boolean;
};

export function ProjectActions(props: ProjectActionsProps) {
	const playClick = usePlayClick();
	const isSmallDevice = useMediaQuery("(max-width : 640px)");
	const {
		project,
		projects,
		setProjects,
		actions,
		index,
		toggleActiveProject,
		minutes,
	} = props;

	async function copyProjectLog(project: Project) {
		playClick();

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

	function removeProject(project: Project) {
		playClick();
		const newProjects = projects.filter((e) => e.slug !== project.slug);
		setProjects(newProjects);
	}

	function renameProjectActivity(project: Project) {
		playClick();
		const activityName = askForActivityName(project.lastActivityName);

		if (!activityName) return;

		const newProject = { ...project, lastActivityName: activityName };

		setProjects(
			projects.map((p) => (p.slug === project.slug ? newProject : p)),
		);
	}

	useHotkeys(`${index}+r`, () => renameProjectActivity(project), [project]);
	useHotkeys(`${index}+s`, () => toggleActiveProject(project), [project]);

	const ProjectActionsMapper: Record<ProjectAction, ProjectActionProps> = {
		copy: {
			action: copyProjectLog,
			icon: <HiClipboardDocumentList size={20} />,
			disabled: project.times.length === 0,
		},
		remove: {
			action: removeProject,
			icon: <HiMinusCircle size={20} />,
		},
		reset: {
			action: resetProject,
			icon: <HiArrowPath size={20} />,
			disabled: project.times.length === 0,
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
				onClick={() => ProjectActionsMapper[button].action(project)}
				className={cn(project.startedAt ? "bg-red-500" : undefined)}
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
