import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
// @ts-expect-error - no types
import { useSound } from "use-sound";
import { Project, Log, ProjectAction, StartedProject } from "./types";
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

export function logToTextParts(log: Log) {
	const [start, end] = log.interval;
	const startTime = new Date(start).toLocaleTimeString();
	const endTime = new Date(end).toLocaleTimeString();
	const diff = end - start;
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

export function getLegend(rangeMinutes: number) {
	const thirdPartM = rangeMinutes / 3;
	const noActivity = "⬜ 0m";
	const oneThird = `< 🟨 < ${Math.floor(thirdPartM)}m`;
	const twoThirds = `< 🟧 < ${Math.floor(thirdPartM * 2)}m`;
	const full = `< 🟥 < ${rangeMinutes}m`;

	return `Legend: ${noActivity} ${oneThird} ${twoThirds} ${full}`;
}

type LogsTimelineOptions = {
	start: number;
	logs: Log[];
	end: number;
	rangeMinutes: number;
};

export function logsTimeline(options: LogsTimelineOptions) {
	const { start, logs, end, rangeMinutes } = options;
	const rangeMs = 1000 * 60 * rangeMinutes;
	const thirdPartMs = rangeMs / 3;
	let visualization = "";

	const timeRange = logs.flatMap((log) => {
		const [start, end] = log.interval;
		const logRange = [...createRange(start, end, rangeMs)];
		return logRange.map((rangeItem) => ({
			start: rangeItem,
			length: Math.min(rangeMs, end - rangeItem),
		}));
	});

	for (
		let intervalStart = start;
		intervalStart <= end;
		intervalStart += rangeMs
	) {
		const intervalEnd = intervalStart + rangeMs;
		const blocksInRange = timeRange.filter((rangeItem) =>
			inRange(rangeItem.start, intervalStart, intervalEnd),
		);

		if (blocksInRange.length !== 0) {
			const sumMs = sum(blocksInRange.map((e) => e.length));

			if (sumMs < thirdPartMs) {
				visualization += "🟨";
			} else if (sumMs < thirdPartMs * 2) {
				visualization += "🟧";
			} else {
				visualization += "🟥";
			}
		} else {
			visualization += "⬜";
		}
	}

	return visualization;
}

function* createRange(start: number, end: number, step = 1) {
	for (let i = start; i < end; i += step) {
		yield i;
	}
}

function inRange(value: number, start: number, end: number): boolean {
	return start <= value && value <= end;
}

export function getLogsConstraints(logs: Log[], projects: Project[]) {
	const startedAts = projects.map((e) => e.startedAt).filter(Boolean);
	const endedAts = startedAts.length ? [Date.now()] : [];

	const start = Math.min(...logs.map((e) => e.interval[0]), ...startedAts);
	const end = Math.max(...logs.map((e) => e.interval[1]), ...endedAts);

	return { start, end };
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

const sumStartedAts = (startedAts: number[]) =>
	sum(startedAts.map((startedAt) => Date.now() - startedAt));

export function useLiveTotalTime(logs: Log[], projects: Project[]) {
	const logsTime = useMemo(
		() => sum(logs.map((e) => e.interval[1] - e.interval[0])),
		[logs],
	);

	const startedAts = useMemo(
		() => projects.filter(isStartedProject).map((p) => p.startedAt),
		[projects],
	);

	const [totalTime, setTotalTime] = useState(
		logsTime + sumStartedAts(startedAts),
	);

	useEffect(() => {
		setTotalTime(logsTime + sumStartedAts(startedAts));

		if (!projects.some((e) => e.startedAt)) return;

		const interval = setInterval(() => {
			setTotalTime(logsTime + sumStartedAts(startedAts));
		}, 1000);

		return () => clearInterval(interval);
	}, [logsTime, projects, startedAts]);

	return totalTime / 1000;
}

export function isStartedProject(project: Project): project is StartedProject {
	return project.startedAt !== undefined;
}

export function getProjectLogs(project: Project, logs: Log[]) {
	return logs.filter((e) => e.projectSlug === project.slug);
}
