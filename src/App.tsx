import { useState } from "react";
import {
	HiPauseCircle,
	HiPlayCircle,
	HiBars3BottomLeft,
	HiArrowSmallUp,
} from "react-icons/hi2";
import { hash, date } from "virtual:local";
import {
	logsTimeline,
	getLogsConstraints,
	logToTextParts,
	useSortableList,
	useDynamicFavicon,
	useProjectButtons,
	getLegend,
	useDataContext,
	useWithClick,
	cn,
} from "./utils";
import { Button } from "./Button";
import { ProjectAction, projectActions } from "./types";
import { TotalInfo } from "./TotalInfo";
import { AddForm } from "./AddForm";
import { ProjectsLogs } from "./ProjectsLogs";
import { ProjectInfo } from "./ProjectInfo";
import { Modal } from "./Modal";
import { Checkbox } from "./Checkbox";
import { ReactSortable } from "react-sortablejs";
import { ProjectActions } from "./ProjectActions";
import { HeaderActions } from "./HeaderActions";

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
	const [sortableList, setSortableList] = useSortableList();

	const {
		projects,
		logs,
		getProjectLogs,
		shouldAskForActivityName,
		setShouldAskForActivityName,
		toggleActiveProject,
		getProjectStartedLogs,
		startedLogs,
	} = useDataContext();

	useDynamicFavicon();

	const constraints = getLogsConstraints(logs, startedLogs);
	const timelineLength = 32;
	const diff = constraints[1] - constraints[0];
	const intervalMinutes = Math.ceil(diff / timelineLength / 1000 / 60);

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
		<div className="container max-w-screen-md border-x border-base-300 min-h-screen flex flex-col">
			<header className="py-3 flex items-center gap-4 ">
				<div className="btn btn-sm sm:btn-md btn-primary">
					<div className="badge uppercase">Jagaatrack</div>
				</div>
				<strong className="hidden sm:inline mt-0.5">
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
				className="py-3 space-y-3"
				list={sortableList}
				setList={setSortableList}
				handle=".js-handle"
			>
				{projects.map((project, index) => {
					const isStarted = getProjectStartedLogs(project).length > 0;

					return (
						<article key={project.slug} className="flex gap-3">
							<Button
								className={isStarted ? "btn-error" : undefined}
								onClick={() => {
									toggleActiveProject(project);
								}}
							>
								{isStarted ? (
									<HiPauseCircle size={20} />
								) : (
									<HiPlayCircle size={20} />
								)}
							</Button>

							<div className="grow relative">
								<div className="absolute left-2 inset-y-0 items-center hidden sm:flex">
									<button
										className={cn(
											"js-handle p-2",
											isStarted && "text-error-content",
										)}
									>
										<HiBars3BottomLeft />
									</button>
								</div>
								<ProjectInfo project={project} />
								<div className="absolute right-4 inset-y-0 items-center hidden lg:flex">
									{index < 9 && (
										<kbd className="kbd kbd-sm border-primary">{index + 1}</kbd>
									)}
								</div>
							</div>

							<ProjectActions
								project={project}
								actions={projectButtons}
								index={index + 1}
								toggleActiveProject={toggleActiveProject}
								intervalMinutes={intervalMinutes}
								timelineLength={timelineLength}
								constraints={constraints}
							/>
						</article>
					);
				})}
			</ReactSortable>

			<div className="flex gap-2 mb-2">
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
				className="btn fixed btn-sm btn-square bottom-2 left-2 md:left-auto md:right-2"
			>
				<HiArrowSmallUp />
			</button>

			<Modal active={showSettingsModal} setActive={setShowSettingsModal}>
				<div className="grid gap-2">
					<fieldset>
						<legend>Actions</legend>
						<Checkbox
							item="Ask for activity name?"
							isChecked={shouldAskForActivityName}
							setIsChecked={setShouldAskForActivityName}
						/>
					</fieldset>

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
					</fieldset>

					<div className="font-mono text-xs flex gap-1 items-center justify-center p-1 rounded">
						<span>{hash}</span>
						<span>:</span>
						<span>{date}</span>
					</div>
				</div>
			</Modal>
		</div>
	);
}
