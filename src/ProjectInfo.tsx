import { useState, useMemo, useEffect } from "react";
import { Input } from "./Input";
import { Project } from "./types";
import { cn, secondsToHumanFormat, sumProjectTimesInSeconds } from "./utils";

export function ProjectInfo({ project }: { project: Project }) {
	const [totalTime, setTotalTime] = useState(() =>
		sumProjectTimesInSeconds(project),
	);

	const totalTimeHuman = useMemo(
		() => secondsToHumanFormat(totalTime),
		[totalTime],
	);

	useEffect(() => {
		setTotalTime(sumProjectTimesInSeconds(project));

		if (!project.startedAt) return;

		const interval = setInterval(() => {
			setTotalTime(sumProjectTimesInSeconds(project));
		}, 1000);

		return () => clearInterval(interval);
	}, [project]);

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
