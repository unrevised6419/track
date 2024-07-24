import { Command } from "cmdk";
import "./command-menu.component.css";
import { useDataContext } from "./data.context";
import { useCommandMenuContext } from "./command-menu.context";
import { cn } from "./utils";

export function CommandMenu() {
	const {
		showCommandMenu,
		setShowCommandMenu,
		commandMenuActivities,
		inputValue,
		setInputValue,
		selectedProject,
		setSelectedProject,
	} = useCommandMenuContext();

	const {
		getProjectBySlug,
		createNewStartedLogForActivity,
		createNewStartedLogForActivityName,
	} = useDataContext();

	return (
		<Command.Dialog
			open={showCommandMenu}
			onOpenChange={(open) => {
				setInputValue("");
				setShowCommandMenu(open);
			}}
			onKeyDown={(e: React.KeyboardEvent) => {
				if (e.key === "Backspace" && inputValue.length === 0) {
					e.preventDefault();
					setSelectedProject(undefined);
				}

				const isShiftEnter = e.key === "Enter" && e.shiftKey;

				if (selectedProject && isShiftEnter && inputValue.length > 0) {
					e.preventDefault();
					createNewStartedLogForActivityName({
						activityName: inputValue,
						project: selectedProject,
					});
					setShowCommandMenu(false);
				}
			}}
		>
			<div
				className={cn("input mb-2 flex w-full items-center gap-2", {
					"pl-1": selectedProject,
				})}
			>
				{selectedProject && <kbd className="kbd">{selectedProject.name}</kbd>}

				<Command.Input
					autoFocus
					placeholder="What do you work on?"
					value={inputValue}
					onValueChange={(value) => {
						setInputValue(value);
					}}
				/>
			</div>

			<Command.List>
				<Command.Empty>No results found.</Command.Empty>

				{commandMenuActivities.map((activity) => {
					const project = getProjectBySlug(activity.projectSlug);
					return (
						<Command.Item
							key={`${project.slug}-${project.name}-${activity.name}`}
							onSelect={() => {
								createNewStartedLogForActivity(activity);
								setShowCommandMenu(false);
							}}
						>
							{activity.name}

							{!selectedProject && (
								<kbd className="kbd kbd-xs ml-auto">{project.name}</kbd>
							)}
						</Command.Item>
					);
				})}
			</Command.List>
		</Command.Dialog>
	);
}
