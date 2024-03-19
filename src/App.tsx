import { useState } from "react";
import { HiArrowSmallUp } from "react-icons/hi2";
import { hash, date } from "virtual:local";
import {
	logsTimeline,
	getLogsConstraints,
	logToTextParts,
	useSortableList,
	useDynamicFavicon,
	useProjectButtons,
	getLegend,
	useWithClick,
	storageKey,
} from "./utils";
import { ProjectAction, projectActions } from "./types";
import { TotalInfo } from "./TotalInfo";
import { AddForm } from "./AddForm";
import { ProjectsLogs } from "./ProjectsLogs";
import { Modal } from "./Modal";
import { Checkbox } from "./Checkbox";
import { ReactSortable } from "react-sortablejs";
import { HeaderActions } from "./HeaderActions";
import { useHotkeys } from "react-hotkeys-hook";
import { ProjectRow } from "./ProjectRow";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useDataContext } from "./data-context";
import { CommandMenu } from "./CommandMenu";

const ProjectActionsSettingsProps: Record<ProjectAction, string> = {
	reset: "Project Time Reset",
	copy: "Project Log Copy",
	remove: "Project Remove",
	rename: "Rename Project Activity Name",
};

export function App() {
	const [projectButtons, toggleProjectButton] = useProjectButtons();
	const [showLogs, setShowLogs] = useState(false);
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [showCommandMenu, setShowCommandMenu] = useState(false);
	const [sortableList, setSortableList] = useSortableList();
	const [showOrderButton, setShowOrderButton] = useLocalStorage(
		storageKey("show-project-reorder"),
		true,
	);

	const {
		projects,
		logs,
		getProjectLogs,
		stopAllProjects,
		startedLogs,
		startNewLog,
	} = useDataContext();

	useDynamicFavicon();

	const constraints = getLogsConstraints(logs, startedLogs);
	const timelineLength = 32;
	const diff = constraints.endedAt - constraints.startedAt;
	const intervalMinutes = Math.ceil(diff / timelineLength / 1000 / 60);

	useHotkeys(`s`, stopAllProjects, { enabled: startedLogs.length > 0 });
	useHotkeys(`l`, startNewLog, { enabled: startedLogs.length > 0 });
	useHotkeys(`meta+k`, () => {
		setShowCommandMenu(!showCommandMenu);
	});

	const onCopyLogs = useWithClick(() => {
		const projectsTimeline = projects
			.map((project) => ({ project, projectLogs: getProjectLogs(project) }))
			.filter(({ projectLogs }) => projectLogs.length > 0)
			.map(({ project, projectLogs }) => {
				const timeline = logsTimeline({
					constraints,
					logs: projectLogs,
					intervalMinutes,
					timelineLength,
				});

				return `${timeline} ${project.name} (${project.slug})`;
			});

		const formattedLogs = logs.map((log) => {
			const { timestamp, name, diffHuman } = logToTextParts(log);
			return `(${timestamp}) ${name} [${diffHuman}]`;
		});

		const text = [
			projectsTimeline.join("\n"),
			`${getLegend(intervalMinutes)}\n`,
			formattedLogs.join("\n"),
		].join("\n");

		void navigator.clipboard.writeText(text);
	});

	const onShowLogs = useWithClick(() => {
		setShowLogs(!showLogs);
	});

	return (
		<div className="container flex min-h-screen max-w-screen-md flex-col border-x border-base-300">
			<CommandMenu open={showCommandMenu} setOpen={setShowCommandMenu} />

			<header className="flex items-center gap-4 py-3 ">
				<div className="btn btn-primary btn-sm sm:btn-md">
					<div className="badge uppercase">Jagaatrack</div>
				</div>
				<strong className="mt-0.5 hidden sm:inline">
					Why are you running?
				</strong>
				<HeaderActions
					className="ml-auto"
					onShowSettingsModal={() => {
						setShowSettingsModal(true);
					}}
				/>
			</header>

			<TotalInfo />
			<AddForm />

			<ReactSortable
				tag="main"
				className="space-y-3 py-3"
				list={sortableList}
				setList={setSortableList}
				handle=".js-handle"
			>
				{projects.map((project, index) => (
					<ProjectRow
						key={project.slug}
						project={project}
						projectButtons={projectButtons}
						intervalMinutes={intervalMinutes}
						timelineLength={timelineLength}
						constraints={constraints}
						order={index + 1}
						showOrderButton={showOrderButton}
					/>
				))}
			</ReactSortable>

			<div className="mb-2 flex gap-2">
				<button className="btn btn-sm grow" onClick={onShowLogs}>
					{showLogs ? "Hide Logs" : "Show Logs"}
				</button>
				<button className="btn btn-sm w-[108px]" onClick={onCopyLogs}>
					Copy Logs
				</button>
			</div>

			{showLogs && <ProjectsLogs />}

			<button
				onClick={() => {
					window.scrollTo({ top: 0, behavior: "smooth" });
				}}
				className="btn btn-square btn-sm fixed bottom-2 left-2 md:left-auto md:right-2"
			>
				<HiArrowSmallUp />
			</button>

			<Modal active={showSettingsModal} setActive={setShowSettingsModal}>
				<div className="grid gap-2">
					<fieldset className="grid gap-2">
						<legend>Show Buttons</legend>
						{projectActions.map((button) => (
							<Checkbox
								key={button}
								item={ProjectActionsSettingsProps[button]}
								isChecked={projectButtons.includes(button)}
								setIsChecked={() => {
									toggleProjectButton(button);
								}}
							/>
						))}
						<Checkbox
							item="Project Reorder"
							isChecked={showOrderButton}
							setIsChecked={() => {
								setShowOrderButton(!showOrderButton);
							}}
						/>
					</fieldset>

					<div className="flex items-center justify-center gap-1 rounded p-1 font-mono text-xs">
						<span>{hash}</span>
						<span>:</span>
						<span>{date}</span>
					</div>
				</div>
			</Modal>
		</div>
	);
}
