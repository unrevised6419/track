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
			defaultValue={`(${totalTimeHuman}) ${project.name}, ${project.slug}`}
			readOnly
			placeholder=""
			className={cn(
				"input input-bordered w-full font-mono lg:pr-12 sm:pl-10",
				isStarted ? "bg-error text-error-content input-error" : undefined,
				!totalTime ? "text-base-content/40" : undefined,
			)}
		/>
	);
}
