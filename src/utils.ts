import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
// @ts-expect-error - no types
import { useSound } from "use-sound";
import { Project, Log, ProjectAction } from "./types";
import {
	Dispatch,
	SetStateAction,
	useMemo,
	useCallback,
	useEffect,
	useState,
} from "react";
import { ItemInterface } from "react-sortablejs";
import { useFavicon, useLocalStorage } from "@uidotdev/usehooks";

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

export function projectToLogs(
	project: Project,
	options: { sortByTime: boolean },
): Log[] {
	const logs = project.times.map<Log>((t) => ({
		...t,
		projectSlug: project.slug,
		activityName: t.activityName || project.name,
	}));

	return options.sortByTime
		? logs.sort((t1, t2) => t2.endedAt - t1.endedAt)
		: logs;
}

export function projectsToLogs(
	projects: Project[],
	options: { sortByTime: boolean },
): Log[] {
	const logs = projects.flatMap((p) => projectToLogs(p, options));

	return options.sortByTime
		? logs.sort((t1, t2) => t2.endedAt - t1.endedAt)
		: logs;
}

export function logToTextParts(log: Log) {
	const startTime = new Date(log.startedAt).toLocaleTimeString();
	const endTime = new Date(log.endedAt).toLocaleTimeString();
	const diff = log.endedAt - log.startedAt;
	const diffHuman = secondsToHumanFormat(diff / 1000, "units");

	return {
		timestamp: `${startTime} - ${endTime}`,
		name: `${log.activityName}, ${log.projectSlug}`,
		diffHuman,
	};
}

export function usePlayClick() {
	const [playClick] = useSound("/click.mp3");

	return playClick as () => void;
}

type LogsTimelineOptions = {
	start: number;
	timestamps: number[];
	end: number;
	rangeMinutes: number;
};

export function logsTimeline(options: LogsTimelineOptions) {
	const { start, timestamps, end, rangeMinutes } = options;
	const miuntesInMs = 1000 * 60 * rangeMinutes;
	let visualization = "";

	for (let time = start; time <= end; time += miuntesInMs) {
		const isInRange = timestamps.some((date) =>
			inRange(date, time, time + miuntesInMs),
		);

		visualization += isInRange ? "🟥" : "🟨";
	}

	return visualization;
}

function inRange(value: number, start: number, end: number): boolean {
	return start <= value && value <= end;
}

export function getLogsConstraints(projects: Project[]) {
	const times = projects.flatMap((e) => e.times);
	const startedAts = projects.map((e) => e.startedAt).filter(Boolean);

	const start = Math.min(...startedAts, ...times.map((e) => e.startedAt));
	const end = Math.max(...times.map((e) => e.endedAt));

	return { start, end };
}

export function projectToTimestamps(project: Project, rangeMinutes: number) {
	return project.times.flatMap((e) => {
		const blocks: number[] = [];

		for (let i = e.startedAt; i < e.endedAt; i += 1000 * 60 * rangeMinutes) {
			blocks.push(i);
		}

		return blocks.length > 0 ? blocks : [(e.startedAt + e.endedAt) / 2];
	});
}

type FocusableElements =
	| HTMLInputElement
	| HTMLTextAreaElement
	| HTMLButtonElement
	| HTMLSelectElement
	| HTMLAnchorElement;

export function isFocusable(
	element: Element | null,
): element is FocusableElements {
	const elements = ["INPUT", "TEXTAREA", "BUTTON", "SELECT", "A"];
	return elements.includes(element?.tagName as string);
}

export function askForActivityName(defaultName?: string) {
	const userAnswer = window.prompt("What are you working on?", defaultName);
	return userAnswer || undefined;
}

export function useSortableList({
	projects,
	setProjects,
}: {
	projects: Project[];
	setProjects: Dispatch<SetStateAction<Project[]>>;
}) {
	const projectsList = useMemo<ItemInterface[]>(
		() => projects.map((p) => ({ id: p.slug })),
		[projects],
	);
	const setProjectsList = useCallback(
		(list: ItemInterface[]) => {
			const newProjects = list.map((item) =>
				projects.find((p) => p.slug === item.id),
			);

			setProjects(newProjects as Project[]);
		},
		[projects, setProjects],
	);

	return [projectsList, setProjectsList] as const;
}

const faviconPlay = "/favicon-play.svg";
const faviconPause = "/favicon-pause.svg";

export function useDynamicFavicon(projects: Project[]) {
	const playing = useMemo(() => projects.some((e) => e.startedAt), [projects]);
	const [favicon, setFavicon] = useState(playing ? faviconPlay : faviconPause);

	useFavicon(favicon);

	useEffect(() => {
		setFavicon(playing ? faviconPlay : faviconPause);
	}, [playing]);
}

export function storageKey(key: string) {
	return `jagaatrack:${key}`;
}

export function useProjectButtons() {
	const [projectButtons, _setProjectButtons] = useLocalStorage<ProjectAction[]>(
		storageKey("project-end-buttons"),
		["copy", "rename"],
	);

	function toggleProjectButton(button: ProjectAction) {
		const newButtons = projectButtons.includes(button)
			? projectButtons.filter((e) => e !== button)
			: [...projectButtons, button];

		_setProjectButtons([...new Set(newButtons)]);
	}

	return [projectButtons, toggleProjectButton] as const;
}

export function useLiveTotalTime(projects: Project[]) {
	const [totalTime, setTotalTime] = useState(() =>
		sumProjectsTimesInSeconds(projects),
	);

	useEffect(() => {
		setTotalTime(sumProjectsTimesInSeconds(projects));

		if (!projects.some((e) => e.startedAt)) return;

		const interval = setInterval(() => {
			setTotalTime(sumProjectsTimesInSeconds(projects));
		}, 1000);

		return () => clearInterval(interval);
	}, [projects]);

	return totalTime;
}
