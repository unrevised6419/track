import React from "react";
import { Command } from "cmdk";
import "./CommandMenu.css";
import { useDataContext } from "./data-context";
import { useMenuProviderContext } from "./command-menu-context";

export function CommandMenu() {
	const { showCommandMenu, setShowCommandMenu } = useMenuProviderContext();

	const ref = React.useRef<HTMLDivElement | null>(null);
	const [inputValue, setInputValue] = React.useState("");

	const { activities, getProjectBySlug, createNewStartedLogFromActivity } =
		useDataContext();

	return (
		<Command.Dialog
			ref={ref}
			open={showCommandMenu}
			onOpenChange={setShowCommandMenu}
		>
			<Command.Input
				autoFocus
				placeholder="What do you work on?"
				value={inputValue}
				className="input mb-2 w-full"
				onValueChange={(value) => {
					setInputValue(value);
				}}
			/>

			<Command.List>
				<Command.Empty>No results found.</Command.Empty>

				{activities.map((activity) => {
					const project = getProjectBySlug(activity.projectSlug);
					return (
						<Command.Item
							key={`${activity.projectSlug}-${project.name}`}
							onSelect={() => {
								createNewStartedLogFromActivity(activity);
								setInputValue("");
								setShowCommandMenu(false);
							}}
						>
							{activity.name}
							<kbd className="kbd kbd-xs ml-auto">{project.name}</kbd>
						</Command.Item>
					);
				})}
			</Command.List>
		</Command.Dialog>
	);
}
