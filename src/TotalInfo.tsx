import { useMemo } from "react";
import { secondsToHumanFormat, cn, useLiveTotalTime } from "./utils";
import { useAppContext } from "./AppProvider";

export function TotalInfo() {
	const { projects } = useAppContext();
	const totalTime = useLiveTotalTime(projects);
	const totalTimeHuman = useMemo(
		() => secondsToHumanFormat(totalTime),
		[totalTime],
	);

	const overtime = useMemo(() => {
		const eightHoursInSeconds = 8 * 60 * 60;
		const overtime = totalTime - eightHoursInSeconds;
		return overtime > 0 ? overtime : 0;
	}, [totalTime]);

	const overtimeHuman = useMemo(
		() => secondsToHumanFormat(overtime),
		[overtime],
	);

	return (
		<aside className="bg-gray-200 p-3 rounded-md font-mono text-sm grid grid-cols-2">
			<div>Total: {totalTimeHuman}</div>
			<div className={cn(overtime ? "text-red-500" : undefined)}>
				Overtime: {overtimeHuman}
			</div>
		</aside>
	);
}
