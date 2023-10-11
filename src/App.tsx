import { useCallback, useEffect, useMemo, useState } from "react";
import {
	HiPauseCircle,
	HiPlayCircle,
	HiMinusCircle,
	HiClipboardDocument,
	HiClock,
	HiTrash,
	HiFolderPlus,
	HiArrowPath,
} from "react-icons/hi2";
import { useFavicon, useLocalStorage } from "@uidotdev/usehooks";
import { cn, entriesToLogs, logToTextParts, sum, usePlayClick } from "./utils";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Entry } from "./types";
import { TotalInfo } from "./TotalInfo";
import { AddForm } from "./AddForm";
import { EntriesLogs } from "./EntriesLogs";
import { EntryInfo } from "./EntryInfo";

const faviconPlay = "/favicon-play.svg";
const faviconPause = "/favicon-pause.svg";

export function App() {
	const playClick = usePlayClick();
	const [entries, setEntries] = useLocalStorage<Entry[]>("entries", []);
	const playing = useMemo(() => entries.some((e) => e.startedAt), [entries]);
	const [favicon, setFavicon] = useState(playing ? faviconPlay : faviconPause);
	const [showLogs, setShowLogs] = useState(false);

	useFavicon(favicon);

	useEffect(() => {
		setFavicon(playing ? faviconPlay : faviconPause);
	}, [playing]);

	function removeEntry(entry: Entry) {
		playClick();
		const newEntries = entries.filter((e) => e.slug !== entry.slug);
		setEntries(newEntries);
	}

	const changeActiveEntry = useCallback(
		(entry: Entry) => {
			playClick();

			const newEntries = entries.map((e) => {
				if (e.startedAt) {
					const newEntry: Entry = {
						...e,
						times: [
							...e.times,
							{ startedAt: e.startedAt, endedAt: Date.now() },
						],
						startedAt: undefined,
					};
					return newEntry;
				}

				if (e.slug === entry.slug) {
					const newEntry: Entry = { ...e, startedAt: Date.now() };
					return newEntry;
				}

				return e;
			});

			setEntries(newEntries);
		},
		[entries, playClick, setEntries],
	);

	useEffect(() => {
		function onKeyPress(e: KeyboardEvent) {
			if (document.activeElement !== document.body) return;

			const maybeDigit = Number(e.key);
			if (Number.isNaN(maybeDigit)) return;

			const entry = entries[maybeDigit - 1];
			if (!entry) return;

			changeActiveEntry(entry);
		}

		document.addEventListener("keypress", onKeyPress);
		return () => document.removeEventListener("keypress", onKeyPress);
	}, [changeActiveEntry, entries]);

	async function onExport() {
		playClick();

		const date = new Date().toISOString().split("T").at(0) as string;

		const filteredEntries = entries.filter(
			(e) => e.times.length > 0 || e.startedAt,
		);

		const entriesExports = filteredEntries.map((entry) => {
			const durations = entry.times.map((e) => e.endedAt - e.startedAt);

			if (entry.startedAt) {
				const lastDuration = Date.now() - entry.startedAt;
				durations.push(lastDuration);
			}

			const totalTimeS = sum(durations) / 1000;
			const totalTimeMinutes = Math.ceil(totalTimeS / 60);
			const totalTimeHours = totalTimeMinutes / 60;
			const totalTime = totalTimeHours.toFixed(2);

			return `/track ${date} ${entry.slug} ${totalTime} TODO ${entry.name}`;
		});

		await navigator.clipboard.writeText(entriesExports.join("\n"));

		window.alert("Jagaad Manager Export format was copied to clipboard!");
	}

	function onResetTimers() {
		playClick();

		const shouldReset = window.confirm(
			"Are you sure you want to reset all timers?",
		);

		if (!shouldReset) return;

		const newEntries = entries.map((e) => ({
			...e,
			times: [],
			startedAt: undefined,
		}));

		setEntries(newEntries);
	}

	function onFullReset() {
		playClick();

		const shouldReset = window.confirm(
			"Are you sure you want to reset everything?",
		);

		if (!shouldReset) return;

		setEntries([]);
	}

	function onImport() {
		playClick();

		const text = window.prompt("Paste the Jagaad Manager `/projects me` here");

		if (!text) return;

		const lines = text
			.split("\n")
			.map((line) => line.split("] - ").at(0)?.split("• ").at(-1)?.trim())
			.filter(Boolean);

		const newEntries = lines.map((line) => {
			const [name, slug] = line.split(" [");

			return {
				slug,
				name,
				times: [],
				startedAt: undefined,
			};
		});

		const filteredEntries = newEntries.filter(
			(entry) => !entries.some((e) => e.slug === entry.slug),
		);

		setEntries([...entries, ...filteredEntries]);
	}

	function resetEntry(entry: Entry) {
		playClick();

		const newEntries = entries.map((e) => {
			if (e.slug === entry.slug) {
				return { ...e, times: [], startedAt: undefined };
			}

			return e;
		});

		setEntries(newEntries);
	}

	async function onCopyLogs() {
		playClick();

		const logs = entriesToLogs(entries, { sort: false });
		const text = logs.map((log) => {
			const { timestamp, name, diffHuman } = logToTextParts(log);
			return `(${timestamp}) ${name} [${diffHuman}]`;
		});

		await navigator.clipboard.writeText(text.join("\n"));

		window.alert("Logs copied to clipboard!");
	}

	return (
		<div className="container max-w-2xl border-x min-h-screen flex flex-col">
			<header className="py-3 flex items-center gap-4 ">
				<Badge badgeText="Jagaatrack" />
				<strong className="hidden sm:inline mt-0.5">
					Why are you running?
				</strong>
				<div className="ml-auto flex gap-2">
					<button onClick={onFullReset} className="p-3" title="Full Reset">
						<HiTrash size={20} />
					</button>
					<button onClick={onResetTimers} className="p-3" title="Reset Timers">
						<HiClock size={20} />
					</button>
					<button onClick={onImport} className="p-3" title="Import JM Projects">
						<HiFolderPlus size={20} />
					</button>
					<button onClick={onExport} className="p-3" title="Export JM Format">
						<HiClipboardDocument size={20} />
					</button>
				</div>
			</header>

			<TotalInfo entries={entries} />

			<AddForm entries={entries} setEntries={setEntries} />

			<main className="py-3 space-y-3">
				{entries.map((entry, index) => (
					<article key={entry.slug} className="flex gap-3 items-stretch">
						<Button
							className={entry.startedAt ? "bg-red-500" : undefined}
							onClick={() => changeActiveEntry(entry)}
						>
							{entry.startedAt ? (
								<HiPauseCircle size={20} />
							) : (
								<HiPlayCircle size={20} />
							)}
						</Button>

						<div className="grow relative">
							<EntryInfo entry={entry} />
							<div className="absolute right-4 inset-y-0 items-center hidden lg:flex">
								{index < 9 && (
									<kbd className="rounded-md bg-black text-xs font-mono text-white px-1.5 border border-jagaatrack">
										{index + 1}
									</kbd>
								)}
							</div>
						</div>

						<Button
							onClick={() => resetEntry(entry)}
							className={cn(
								"hidden sm:flex",
								entry.startedAt ? "bg-red-500" : undefined,
							)}
						>
							<HiArrowPath size={20} />
						</Button>
						<Button
							onClick={() => removeEntry(entry)}
							className={entry.startedAt ? "bg-red-500" : undefined}
						>
							<HiMinusCircle size={20} />
						</Button>
					</article>
				))}
			</main>

			<div className="flex gap-2">
				<button
					className="bg-gray-200 px-3 py-2 rounded-md mb-2 text-xs text-center font-bold flex justify-center items-center gap-3 grow"
					onClick={() => {
						playClick();
						setShowLogs(!showLogs);
					}}
				>
					{showLogs ? "Hide Logs" : "Show Logs"}
				</button>
				<button
					className="bg-gray-200 px-3 py-2 rounded-md mb-2 text-xs text-center font-bold flex justify-center items-center gap-3"
					onClick={onCopyLogs}
				>
					Copy Logs
				</button>
			</div>

			{showLogs && <EntriesLogs entries={entries} />}
		</div>
	);
}
