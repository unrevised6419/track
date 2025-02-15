import {
	HiTrash,
	HiClock,
	HiFolderPlus,
	HiClipboardDocument,
	HiCog8Tooth,
} from "react-icons/hi2";
import { HeaderButton } from "./header-button.component";
import { cn, splitEnd, splitStart, useWithClick } from "./utils";
import { Project } from "./types";
import { useDataContext } from "./data.context";

type HeaderActionsProps = {
	className?: string;
	onShowSettingsModal: () => void;
};

export function HeaderActions(props: HeaderActionsProps) {
	const { className, onShowSettingsModal } = props;
	const {
		projects,
		removeAllProjectsAndLogs,
		removeAllLogs,
		importProjects,
		createProjectTracks,
	} = useDataContext();

	const onFullReset = useWithClick(() => {
		const shouldReset = globalThis.confirm(
			"Are you sure you want to remove everything for all days?",
		);

		if (shouldReset) {
			removeAllProjectsAndLogs();
		}
	});

	const onResetTimers = useWithClick(() => {
		const shouldReset = globalThis.confirm(
			"Are you sure you want to remove all logs for all days?",
		);

		if (shouldReset) {
			removeAllLogs();
		}
	});

	const onImport = useWithClick(() => {
		const text = globalThis.prompt(
			"Paste the Jagaad Manager `/projects me` here",
		);

		if (!text) return;

		// Firefox converts newlines in spaces, others don't
		// https://bugzilla.mozilla.org/show_bug.cgi?id=1716229
		const adjustedLines = text
			.replaceAll("\n", " ")
			.replaceAll("• ", "\n")
			.split("\n")
			.filter(Boolean)
			.map((l) => `• ${l}`.trim());

		const newProjects = adjustedLines.map((line) => {
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
		const projectsTracks = projects.flatMap((project) =>
			createProjectTracks(project),
		);

		void navigator.clipboard.writeText(projectsTracks.join("\n\n")).then(() => {
			globalThis.alert("Jagaad Manager Export format was copied to clipboard!");
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
