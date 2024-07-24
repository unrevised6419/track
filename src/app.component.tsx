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
import { TotalInfo } from "./total-info.component";
import { AddProjectForm } from "./add-project.form";
import { ProjectsLogs } from "./projects-logs.component";
import { Modal } from "./modal.component";
import { Checkbox } from "./checkbox.component";
import { ReactSortable } from "react-sortablejs";
import { HeaderActions } from "./header-actions.component";
import { useHotkeys } from "react-hotkeys-hook";
import { ProjectRow } from "./project-row.component";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useDataContext } from "./data.context";
import { CommandMenu } from "./command-menu.component";
import { useCommandMenuContext } from "./command-menu.context";

const ProjectActionsLabels: Record<ProjectAction, string> = {
	reset: "Project Time Reset",
	copy: "Project Log Copy",
	remove: "Project Remove",
};

export function App() {
	const [projectButtons, toggleProjectButton] = useProjectButtons();
	const [showLogs, setShowLogs] = useState(false);
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [sortableList, setSortableList] = useSortableList();
	const [showOrderButton, setShowOrderButton] = useLocalStorage(
		storageKey("show-project-reorder"),
		true,
	);

	const { toggleCommandMenu, showCommandMenuForProject } =
		useCommandMenuContext();

	const {
		projects,
		logs,
		getProjectLogs,
		stopAllProjects,
		startedLogs,
		selectedDate,
		setSelectedDate,
		firstStartedProject,
	} = useDataContext();

	useDynamicFavicon();

	useHotkeys(`s`, stopAllProjects, { enabled: startedLogs.length > 0 });
	useHotkeys(
		`l`,
		(event) => {
			if (!firstStartedProject) return;
			event.preventDefault();
			showCommandMenuForProject(firstStartedProject);
		},
		{ enabled: startedLogs.length > 0 },
	);
	useHotkeys(`meta+k`, toggleCommandMenu);

	const onCopyLogs = useWithClick(() => {
		const constraints = getLogsConstraints(logs, startedLogs);
		const timelineLength = 32;
		const diff = constraints.endedAt - constraints.startedAt;
		const intervalMinutes = Math.ceil(diff / timelineLength / 1000 / 60);

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
		<div className="container flex min-h-screen max-w-screen-md flex-col gap-y-4 border-x border-base-300 py-4">
			<CommandMenu />

			<header className="flex items-center gap-4">
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

			<div className="flex flex-col gap-3 sm:flex-row">
				<div className="grow">
					<TotalInfo />
				</div>
				<input
					type="date"
					placeholder="Date"
					className="input input-bordered"
					value={selectedDate}
					onChange={(e) => {
						setSelectedDate(e.target.value);
					}}
				/>
			</div>

			<ReactSortable
				tag="main"
				className="space-y-3"
				list={sortableList}
				setList={setSortableList}
				handle=".js-handle"
			>
				{projects.map((project, index) => (
					<ProjectRow
						key={project.slug}
						project={project}
						projectButtons={projectButtons}
						order={index + 1}
						showOrderButton={showOrderButton}
					/>
				))}
			</ReactSortable>

			<AddProjectForm />

			<div className="flex gap-2">
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
								item={ProjectActionsLabels[button]}
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
