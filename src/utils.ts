import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
// @ts-expect-error - no types
import { useSound } from "use-sound";
import { Entry, Log } from "./types";

export function sum(items: number[]) {
	return items.reduce((acc, e) => acc + e, 0);
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function secondsToHumanFormat(
	value: number,
	separator: "units" | "colon" = "colon",
) {
	const hours = Math.floor(value / 60 / 60);
	const minutes = Math.floor(value / 60) % 60;
	const seconds = Math.ceil(value % 60);

	const pairs = [
		{ value: hours, label: "h" },
		{ value: minutes, label: "m" },
		{ value: seconds, label: "s" },
	];

	if (separator === "units") {
		return pairs
			.filter((pair) => pair.value > 0)
			.map((pair) => `${pair.value}${pair.label}`)
			.join(" ");
	}

	const hoursPadded = String(hours).padStart(2, "0");
	const minutesPadded = String(minutes).padStart(2, "0");
	const secondsPadded = String(seconds).padStart(2, "0");

	return `${hoursPadded}:${minutesPadded}:${secondsPadded}`;
}

export function sumEntryTimesInSeconds(entry: Entry) {
	const durations = entry.times.map((t) => t.endedAt - t.startedAt);

	if (entry.startedAt) {
		const lastDuration = Date.now() - entry.startedAt;
		durations.push(lastDuration);
	}

	return sum(durations) / 1000;
}

export function sumEntriesTimesInSeconds(entries: Entry[]) {
	const durations = entries.map((entry) => sumEntryTimesInSeconds(entry));
	return sum(durations);
}

export function entriesToLogs(
	entries: Entry[],
	options: { sort: boolean },
): Log[] {
	const logs = entries.flatMap<Log>((e) =>
		e.times.map((t) => ({
			...t,
			entry: e,
			activityName: t.activityName || e.name,
		})),
	);

	return options.sort ? logs.sort((t1, t2) => t2.endedAt - t1.endedAt) : logs;
}

export function logToTextParts(log: Log) {
	const startTime = new Date(log.startedAt).toLocaleTimeString();
	const endTime = new Date(log.endedAt).toLocaleTimeString();
	const diff = log.endedAt - log.startedAt;
	const diffHuman = secondsToHumanFormat(diff / 1000, "units");

	return {
		timestamp: `${startTime} - ${endTime}`,
		name: `${log.activityName}, ${log.entry.slug}`,
		diffHuman,
	};
}

export function usePlayClick() {
	const [playClick] = useSound("/click.mp3");

	return playClick;
}
