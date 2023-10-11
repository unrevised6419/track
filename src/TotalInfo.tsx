import { useState, useMemo, useEffect } from "react";
import { Entry } from "./types";
import { sumEntriesTimesInSeconds, secondsToHumanFormat, cn } from "./utils";

export function TotalInfo({ entries }: { entries: Entry[] }) {
	const [totalTime, setTotalTime] = useState(() =>
		sumEntriesTimesInSeconds(entries),
	);
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

	useEffect(() => {
		setTotalTime(sumEntriesTimesInSeconds(entries));

		if (!entries.some((e) => e.startedAt)) return;

		const interval = setInterval(() => {
			setTotalTime(sumEntriesTimesInSeconds(entries));
		}, 1000);

		return () => clearInterval(interval);
	}, [entries]);

	return (
		<aside className="bg-gray-200 p-3 rounded-md font-mono text-sm grid grid-cols-2">
			<div>Total: {totalTimeHuman}</div>
			<div className={cn(overtime ? "text-red-500" : undefined)}>
				Overtime: {overtimeHuman}
			</div>
		</aside>
	);
}
