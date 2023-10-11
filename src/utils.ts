import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
// @ts-expect-error - no types
import { useSound } from "use-sound";
import { Project, Log } from "./types";

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

export function sumProjectTimesInSeconds(project: Project) {
	const durations = project.times.map((t) => t.endedAt - t.startedAt);

	if (project.startedAt) {
		const lastDuration = Date.now() - project.startedAt;
		durations.push(lastDuration);
	}

	return sum(durations) / 1000;
}

export function sumProjectsTimesInSeconds(projects: Project[]) {
	const durations = projects.map((project) =>
		sumProjectTimesInSeconds(project),
	);
	return sum(durations);
}

export function projectsToLogs(
	projects: Project[],
	options: { sort: boolean },
): Log[] {
	const logs = projects.flatMap((p) =>
		p.times.map<Log>((t) => ({
			...t,
			project: p,
			activityName: t.activityName || p.name,
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
		name: `${log.activityName}, ${log.project.slug}`,
		diffHuman,
	};
}

export function usePlayClick() {
	const [playClick] = useSound("/click.mp3");

	return playClick;
}
