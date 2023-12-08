import { useMemo } from "react";
import { Project } from "./types";
import { cn, msToHumanFormat, useDataContext, useLiveTotalTime } from "./utils";

export function ProjectInfo({ project }: { project: Project }) {
	const localProjects = useMemo(() => [project], [project]);
	const totalTime = useLiveTotalTime(localProjects);
	const totalTimeHuman = useMemo(() => msToHumanFormat(totalTime), [totalTime]);
	const { getProjectStartedLogs } = useDataContext();
	const isStarted = useMemo(
		() => getProjectStartedLogs(project).length > 0,
		[getProjectStartedLogs, project],
	);

	return (
		<input
			value={`(${totalTimeHuman}) ${project.name}, ${project.slug}`}
			onChange={() => {}}
			readOnly
			placeholder=""
			className={cn(
				"input input-bordered w-full font-mono sm:pl-10 lg:pr-12",
				isStarted ? "input-error bg-error text-error-content" : undefined,
				!totalTime ? "text-base-content/40" : undefined,
			)}
		/>
	);
}
