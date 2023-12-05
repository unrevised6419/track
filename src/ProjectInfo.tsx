import { useMemo } from "react";
import { Input } from "./Input";
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
		<Input
			readOnly
			value={`(${totalTimeHuman}) ${project.name}, ${project.slug}`}
			setValue={() => {}}
			placeholder=""
			className={cn(
				"font-mono lg:pr-12 sm:pl-10",
				isStarted ? "read-only:bg-red-500" : undefined,
				!totalTime ? "text-gray-400" : undefined,
			)}
		/>
	);
}
