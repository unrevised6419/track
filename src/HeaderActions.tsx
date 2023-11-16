import {
	HiTrash,
	HiClock,
	HiFolderPlus,
	HiClipboardDocument,
	HiCog8Tooth,
} from "react-icons/hi2";
import { HeaderButton } from "./HeaderButton";
import { cn, sum, usePlayClick } from "./utils";
import { Project } from "./types";
import { Dispatch, SetStateAction } from "react";

type HeaderActionsProps = {
	className?: string;
	onShowSettingsModal: () => void;
	projects: Project[];
	setProjects: Dispatch<SetStateAction<Project[]>>;
};

export function HeaderActions(props: HeaderActionsProps) {
	const { className, onShowSettingsModal, projects, setProjects } = props;

	const playClick = usePlayClick();

	function onFullReset() {
		playClick();

		const shouldReset = window.confirm(
			"Are you sure you want to reset everything?",
		);

		if (!shouldReset) return;

		setProjects([]);
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

	return (
		<div className={cn("flex gap-2", className)}>
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
			<HeaderButton onClick={onShowSettingsModal} title="Open Settings Modal">
				<HiCog8Tooth className="w-6 h-6 sm:w-6 sm:h-6" />
			</HeaderButton>
		</div>
	);
}
