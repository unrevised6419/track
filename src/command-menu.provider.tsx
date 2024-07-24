import { PropsWithChildren, useMemo, useState } from "react";
import { CommandMenuContext } from "./command-menu.context";
import { useWithClick } from "./utils";
import { Project } from "./types";
import { useDataContext } from "./data.context";

export type CommandMenuContextType = ReturnType<typeof useCommandMenuProvider>;

function useCommandMenuProvider() {
	const [showCommandMenu, setShowCommandMenu] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const [selectedProject, setSelectedProject] = useState<Project>();

	const toggleCommandMenu = useWithClick(() => {
		setSelectedProject(undefined);
		setInputValue("");
		setShowCommandMenu(!showCommandMenu);
	});

	const {
		getProjectStartedLogs,
		getProjectActivities,
		stopAllProjects,
		activities,
	} = useDataContext();

	const toggleCommandMenuForProject = useWithClick((project: Project) => {
		const hasStartedLogs = getProjectStartedLogs(project).length > 0;

		if (hasStartedLogs) {
			stopAllProjects();
		} else {
			setSelectedProject(project);
			setInputValue("");
			setShowCommandMenu(true);
		}
	});

	const showCommandMenuForProject = useWithClick((project: Project) => {
		setSelectedProject(project);
		setInputValue("");
		setShowCommandMenu(true);
	});

	const commandMenuActivities = useMemo(() => {
		return selectedProject ? getProjectActivities(selectedProject) : activities;
	}, [activities, getProjectActivities, selectedProject]);

	return {
		showCommandMenu,
		setShowCommandMenu,
		toggleCommandMenu,
		toggleCommandMenuForProject,
		commandMenuActivities,
		inputValue,
		setInputValue,
		selectedProject,
		setSelectedProject,
		showCommandMenuForProject,
	};
}

export function CommandMenuProvider({ children }: PropsWithChildren) {
	const value = useCommandMenuProvider();

	return (
		<CommandMenuContext.Provider value={value}>
			{children}
		</CommandMenuContext.Provider>
	);
}
