import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSound } from "use-sound";
import { Project, Log, ProjectAction, StartedLog, Interval } from "./types";
import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import { ItemInterface } from "react-sortablejs";
import { useFavicon, useLocalStorage } from "@uidotdev/usehooks";
import { useDataContext } from "./data-context";

export function sum(items: number[]) {
	return items.reduce((acc, e) => acc + e, 0);
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function msToHumanFormat(
	ms: number,
	separator: "units" | "colon" = "colon",
) {
	const seconds = ms / 1000;
	const h = Math.floor(seconds / 60 / 60);
	const m = Math.floor(seconds / 60) % 60;
	const s = Math.ceil(seconds % 60);

	const pairs = [
		{ value: h, label: "h" },
		{ value: m, label: "m" },
		{ value: s, label: "s" },
	];

	if (separator === "units") {
		return pairs
			.filter((pair) => pair.value > 0)
			.map((pair) => `${pair.value}${pair.label}`)
			.join(" ");
	}

	return pairs.map(({ value }) => String(value).padStart(2, "0")).join(":");
}

export function logToTextParts(log: Log) {
	const startTime = new Date(log.startedAt).toLocaleTimeString();
	const endTime = new Date(log.endedAt).toLocaleTimeString();
	const diff = log.endedAt - log.startedAt;
	const diffHuman = msToHumanFormat(diff, "units");

	return {
		timestamp: `${startTime} - ${endTime}`,
		name: `${log.activityName}, ${log.projectSlug}`,
		diffHuman,
	};
}

export function useWithClick<Args extends unknown[], Return>(
	fn: (...args: Args) => Return,
) {
	const [playClick] = useSound("/click.mp3");
	return useEffectEvent<Args, Return>((...args) => {
		playClick();
		return fn(...args);
	});
}

export function useEffectEvent<Args extends unknown[], Return>(
	callback: (...args: Args) => Return,
) {
	const ref = useRef(callback);
	ref.current = callback;
	return useCallback<(...args: Args) => Return>(
		(...args) => ref.current(...args),
		[],
	);
}

export function getLegend(intervalMinutes: number) {
	const thirdPartM = intervalMinutes / 3;
	const noActivity = "⬜ 0m";
	const oneThird = `< 🟨 < ${Math.floor(thirdPartM)}m`;
	const twoThirds = `< 🟧 < ${Math.floor(thirdPartM * 2)}m`;
	const full = `< 🟥 < ${intervalMinutes}m`;

	return `Legend: ${noActivity} ${oneThird} ${twoThirds} ${full}`;
}

type LogsTimelineOptions = {
	constraints: Interval;
	logs: ReadonlyArray<Log>;
	intervalMinutes: number;
	timelineLength: number;
};

export function logsTimeline(options: LogsTimelineOptions) {
	const { constraints, logs, intervalMinutes, timelineLength } = options;
	const intervalMs = 1000 * 60 * intervalMinutes;
	const thirdPartMs = intervalMs / 3;

	const intervals = logs.flatMap((log) =>
		[...createInterval(log, intervalMs)].map((start) => ({
			start,
			size: Math.min(intervalMs, log.endedAt - start),
		})),
	);

	const blocksInterval = { startedAt: 0, endedAt: timelineLength };
	const blocks = [...createInterval(blocksInterval)].map((i) => {
		const startedAt = constraints.startedAt + i * intervalMs;
		const endedAt = startedAt + intervalMs;
		const interval = { startedAt, endedAt } as Interval;
		const blocks = intervals.filter(({ start }) => inInterval(start, interval));
		const sumMs = sum(blocks.map((e) => e.size));

		if (sumMs > thirdPartMs * 2) {
			return "🟥";
		} else if (sumMs > thirdPartMs) {
			return "🟧";
		} else if (sumMs > 0) {
			return "🟨";
		} else {
			return "⬜";
		}
	});

	return blocks.join("");
}

function* createInterval({ startedAt, endedAt }: Interval, step = 1) {
	for (let i = startedAt; i < endedAt; i += step) {
		yield i;
	}
}

function inInterval(value: number, interval: Interval): boolean {
	return interval.startedAt <= value && value <= interval.endedAt;
}

export function getLogsConstraints(
	logs: ReadonlyArray<Log>,
	startedLogs: ReadonlyArray<StartedLog>,
) {
	const startedAts = startedLogs.map((e) => e.startedAt).filter(Boolean);
	const endedAts = startedAts.length ? [Date.now()] : [];

	const startedAt = Math.min(...logs.map((e) => e.startedAt), ...startedAts);
	const endedAt = Math.max(...logs.map((e) => e.endedAt), ...endedAts);

	return { startedAt, endedAt } as Interval;
}

export function askForActivityName(defaultName?: string) {
	const userAnswer = window.prompt("What are you working on?", defaultName);
	return userAnswer || "Unknown activity";
}

export function useSortableList() {
	const { projects, sortProjects } = useDataContext();

	const projectsList = useMemo<ItemInterface[]>(
		() => projects.map((p) => ({ id: p.slug })),
		[projects],
	);

	const setProjectsList = useEffectEvent((list: ItemInterface[]) => {
		sortProjects(list.map((p) => p.id.toString()));
	});

	return [projectsList, setProjectsList] as const;
}

const faviconPlay = "/favicon-play.svg";
const faviconPause = "/favicon-pause.svg";

export function useDynamicFavicon() {
	const { startedLogs } = useDataContext();
	const [favicon, setFavicon] = useState(
		startedLogs.length ? faviconPlay : faviconPause,
	);

	useFavicon(favicon);

	useEffect(() => {
		setFavicon(startedLogs.length ? faviconPlay : faviconPause);
	}, [startedLogs.length]);
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

export function sumLogs(logs: ReadonlyArray<Log>) {
	return sum(logs.map((l) => l.endedAt - l.startedAt));
}

function sumStartedLogs(startedLogs: ReadonlyArray<StartedLog>) {
	return sum(startedLogs.map((l) => Date.now() - l.startedAt));
}

export function useLiveTotalTime(projects: ReadonlyArray<Project>) {
	const { getProjectLogs, getProjectStartedLogs } = useDataContext();

	const logs = useMemo(
		() => projects.flatMap((p) => getProjectLogs(p)),
		[getProjectLogs, projects],
	);

	const logsTime = useMemo(
		() => sum(logs.map((e) => e.endedAt - e.startedAt)),
		[logs],
	);

	const startedLogs = useMemo(
		() => projects.flatMap(getProjectStartedLogs),
		[getProjectStartedLogs, projects],
	);

	const [totalTime, setTotalTime] = useState(
		logsTime + sumStartedLogs(startedLogs),
	);

	useEffect(() => {
		setTotalTime(logsTime + sumStartedLogs(startedLogs));

		if (startedLogs.length === 0) return;

		const interval = setInterval(() => {
			setTotalTime(logsTime + sumStartedLogs(startedLogs));
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	}, [logsTime, startedLogs]);

	return totalTime;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const groupBy = <T extends Record<string, any>, K extends keyof T>(
	arr: ReadonlyArray<T>,
	key: K,
): Partial<Record<string, ReadonlyArray<T>>> =>
	arr.reduce<Record<string, ReadonlyArray<T>>>(
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		(acc, item) => ((acc[item[key]] = [...(acc[item[key]] || []), item]), acc),
		{},
	);

export function startedLogToLog(startedLog: StartedLog): Log {
	return {
		activityName: startedLog.activityName,
		projectSlug: startedLog.projectSlug,
		startedAt: startedLog.startedAt,
		endedAt: Date.now(),
	};
}

export function splitEnd(str: string, separator: string): string[] {
	const parts = str.split(separator);
	const end = parts.pop();
	const start = parts.join(separator);
	return end ? [start, end] : [start];
}

export function splitStart(str: string, separator: string): string[] {
	const parts = str.split(separator);
	const start = parts.shift();
	const end = parts.join(separator);
	return start ? [start, end] : [end];
}

export function logsToMachineTimeInHours(logs: ReadonlyArray<Log>) {
	const durations = logs.map((e) => e.endedAt - e.startedAt);
	const totalTimeS = sum(durations) / 1000;
	const totalTimeMinutes = Math.ceil(totalTimeS / 60);
	return totalTimeMinutes / 60;
}

export function getDateString(date: Date) {
	return date.toISOString().split("T").at(0) as string;
}
