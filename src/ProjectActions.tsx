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
	useAppContext,
	usePlayClick,
} from "./utils";
import { ShowMoreDropdown } from "./ShowMoreDropdown";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useHotkeys } from "react-hotkeys-hook";

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
	const playClick = usePlayClick();
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

	const { getProjectLogs, projects, setProjects, logs, setLogs } =
		useAppContext();

	const projectLogs = getProjectLogs(project);

	async function copyProjectLog(project: Project) {
		playClick();

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

		await navigator.clipboard.writeText(log);
	}

	function resetProject(project: Project) {
		playClick();

		const newProjects = projects.map((p) => {
			if (p.slug === project.slug) {
				return { ...p, startedAt: undefined } satisfies Project;
			}

			return p;
		});

		const newLogs = logs.filter((l) => l.projectSlug !== project.slug);

		setProjects(newProjects);
		setLogs(newLogs);
	}

	function removeProject(project: Project) {
		playClick();
		const newProjects = projects.filter((e) => e.slug !== project.slug);
		const newLogs = logs.filter((l) => l.projectSlug !== project.slug);
		setProjects(newProjects);
		setLogs(newLogs);
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
