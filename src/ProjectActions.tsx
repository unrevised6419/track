import {
	HiArrowPath,
	HiMinusCircle,
	HiClipboardDocumentList,
} from "react-icons/hi2";
import { Button } from "./Button";
import { EndButton, Project } from "./types";
import {
	cn,
	getLogsConstraints,
	logsTimeline,
	projectToLogs,
	projectToTimestamps,
	usePlayClick,
} from "./utils";
import { Dispatch, SetStateAction } from "react";

type ProjectActionsProps = {
	project: Project;
	projects: Project[];
	setProjects: Dispatch<SetStateAction<Project[]>>;
	projectEndButtons: EndButton[];
};

type ButtonInfo = {
	action: (project: Project) => void;
	icon: JSX.Element;
};

export function ProjectActions(props: ProjectActionsProps) {
	const playClick = usePlayClick();
	const { project, projects, setProjects, projectEndButtons } = props;

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

	const ProjectActionsMapper: Record<EndButton, ButtonInfo> = {
		copy: {
			action: copyProjectLog,
			icon: <HiClipboardDocumentList size={20} />,
		},
		remove: {
			action: removeProject,
			icon: <HiMinusCircle size={20} />,
		},
		reset: {
			action: resetProject,
			icon: <HiArrowPath size={20} />,
		},
	};

	return (
		<div className="flex gap-3">
			{projectEndButtons.map((button) => (
				<Button
					key={button}
					onClick={() => ProjectActionsMapper[button].action(project)}
					className={cn(project.startedAt ? "bg-red-500" : undefined)}
				>
					{ProjectActionsMapper[button].icon}
				</Button>
			))}
		</div>
	);
}
