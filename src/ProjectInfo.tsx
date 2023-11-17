import { useMemo } from "react";
import { Input } from "./Input";
import { Log, Project } from "./types";
import { cn, secondsToHumanFormat, useLiveTotalTime } from "./utils";

export function ProjectInfo({
	project,
	logs: allLogs,
}: {
	logs: Log[];
	project: Project;
}) {
	const logs = useMemo(
		() => allLogs.filter((log) => log.projectSlug === project.slug),
		[allLogs, project],
	);
	const localProjects = useMemo(() => [project], [project]);
	const totalTime = useLiveTotalTime(logs, localProjects);
	const totalTimeHuman = useMemo(
		() => secondsToHumanFormat(totalTime),
		[totalTime],
	);

	return (
		<Input
			readOnly
			value={`(${totalTimeHuman}) ${project.name}, ${project.slug}`}
			setValue={() => {}}
			placeholder=""
			className={cn(
				"font-mono lg:pr-12 sm:pl-10",
				project.startedAt ? "read-only:bg-red-500" : undefined,
				!totalTime ? "text-gray-400" : undefined,
			)}
		/>
	);
}
