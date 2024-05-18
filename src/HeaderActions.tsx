import {
	HiTrash,
	HiClock,
	HiFolderPlus,
	HiClipboardDocument,
	HiCog8Tooth,
} from "react-icons/hi2";
import { HeaderButton } from "./HeaderButton";
import {
	cn,
	getDateString,
	logsToMachineTimeInHours,
	splitEnd,
	splitStart,
	startedLogToLog,
	useWithClick,
} from "./utils";
import { Project } from "./types";
import { useDataContext } from "./data-context";

type HeaderActionsProps = {
	className?: string;
	onShowSettingsModal: () => void;
};

export function HeaderActions(props: HeaderActionsProps) {
	const { className, onShowSettingsModal } = props;
	const {
		getProjectLogs,
		projects,
		removeAllProjectsAndLogs,
		removeAllLogs,
		importProjects,
		getProjectStartedLogs,
	} = useDataContext();

	const onFullReset = useWithClick(() => {
		const shouldReset = window.confirm(
			"Are you sure you want to reset everything?",
		);

		if (shouldReset) {
			removeAllProjectsAndLogs();
		}
	});

	const onResetTimers = useWithClick(() => {
		const shouldReset = window.confirm(
			"Are you sure you want to reset all timers?",
		);

		if (shouldReset) {
			removeAllLogs();
		}
	});

	const onImport = useWithClick(() => {
		const text = window.prompt("Paste the Jagaad Manager `/projects me` here");

		if (!text) return;

		const newProjects = text.split("\n").map((line) => {
			// • Advisor Online [Evolution] [AO107] - (2024-02-06-NO ENDING)
			//   ^ name                      ^ slug

			// • Advisor Online [Evolution] [AO107
			const a = splitEnd(line.trim(), "] - (").at(0);
			if (!a) return;

			// Advisor Online [Evolution] [AO107
			const b = splitStart(a.trim(), "• ").at(-1);
			if (!b) return;

			// Advisor Online [Evolution]
			// AO107
			const [name, slug] = splitEnd(b.trim(), " [");
			if (!(name && slug)) return;

			return { name: name.trim(), slug: slug.trim() } satisfies Project;
		});

		importProjects(newProjects.filter(Boolean));
	});

	const onExport = useWithClick(() => {
		const projectsExports = projects.map((project) => {
			const logs = [
				...getProjectLogs(project),
				...getProjectStartedLogs(project).map(startedLogToLog),
			];

			if (logs.length === 0) return;

			const date = getDateString(new Date());
			const totalTimeHours = logsToMachineTimeInHours(logs);
			const totalTime = totalTimeHours.toFixed(2);

			return `/track ${date} ${project.slug} ${totalTime} ${project.name}`;
		});

		void navigator.clipboard
			.writeText(projectsExports.filter(Boolean).join("\n"))
			.then(() => {
				window.alert("Jagaad Manager Export format was copied to clipboard!");
			});
	});

	return (
		<div className={cn("flex gap-2", className)}>
			<HeaderButton onClick={onFullReset} title="Full Reset">
				<HiTrash className="h-5 w-5 sm:h-6 sm:w-6" />
			</HeaderButton>
			<HeaderButton onClick={onResetTimers} title="Reset Timers">
				<HiClock className="h-5 w-5 sm:h-6 sm:w-6" />
			</HeaderButton>
			<HeaderButton onClick={onImport} title="Import JM Projects">
				<HiFolderPlus className="h-5 w-5 sm:h-6 sm:w-6" />
			</HeaderButton>
			<HeaderButton onClick={onExport} title="Export JM Format">
				<HiClipboardDocument className="h-5 w-5 sm:h-6 sm:w-6" />
			</HeaderButton>
			<HeaderButton onClick={onShowSettingsModal} title="Open Settings Modal">
				<HiCog8Tooth className="h-5 w-5 sm:h-6 sm:w-6" />
			</HeaderButton>
		</div>
	);
}
