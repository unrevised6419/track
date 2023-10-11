import { useState, useMemo, useEffect } from "react";
import { Input } from "./Input";
import { Entry } from "./types";
import { cn, secondsToHumanFormat, sumEntryTimesInSeconds } from "./utils";

export function EntryInfo({ entry }: { entry: Entry }) {
	const [totalTime, setTotalTime] = useState(() =>
		sumEntryTimesInSeconds(entry),
	);

	const totalTimeHuman = useMemo(
		() => secondsToHumanFormat(totalTime),
		[totalTime],
	);

	useEffect(() => {
		setTotalTime(sumEntryTimesInSeconds(entry));

		if (!entry.startedAt) return;

		const interval = setInterval(() => {
			setTotalTime(sumEntryTimesInSeconds(entry));
		}, 1000);

		return () => clearInterval(interval);
	}, [entry]);

	return (
		<Input
			readOnly
			value={`(${totalTimeHuman}) ${entry.name}, ${entry.slug}`}
			setValue={() => {}}
			placeholder=""
			className={cn(
				"font-mono pr-12",
				entry.startedAt ? "read-only:bg-red-500" : undefined,
				!totalTime ? "text-gray-400" : undefined,
			)}
		/>
	);
}
