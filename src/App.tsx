import { FormEvent, Ref, useEffect, useMemo, useRef, useState } from "react";
import {
	HiPlusCircle,
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
// @ts-expect-error - no types
import { useSound } from "use-sound";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type Time = {
	startedAt: number;
	endedAt: number;
};

type Entry = {
	name: string;
	slug: string;
	times: Time[];
	startedAt?: number;
};

const faviconPlay = "/favicon-play.svg";
const faviconPause = "/favicon-pause.svg";

export function App() {
	const [playClick] = useSound("/click.mp3");
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [entries, setEntries] = useLocalStorage<Entry[]>("entries", []);
	const playing = useMemo(() => entries.some((e) => e.startedAt), [entries]);
	const [favicon, setFavicon] = useState(playing ? faviconPlay : faviconPause);
	const nameInputRef = useRef<HTMLInputElement>(null);

	useFavicon(favicon);

	useEffect(() => {
		setFavicon(playing ? faviconPlay : faviconPause);
	}, [playing]);

	function onAddEntry(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();

		playClick();

		if (!name || !slug) return;
		if (entries.find((entry) => entry.slug === slug)) return;

		setEntries([...entries, { name, slug: slug, times: [] }]);
		setName("");
		setSlug("");
		nameInputRef.current?.focus();
	}

	function removeEntry(entry: Entry) {
		playClick();
		const newEntries = entries.filter((e) => e.slug !== entry.slug);
		setEntries(newEntries);
	}

	function changeActiveEntryAndAddTime(entry: Entry) {
		playClick();

		const newEntries = entries.map((e) => {
			if (e.startedAt) {
				const newEntry: Entry = {
					...e,
					times: [...e.times, { startedAt: e.startedAt, endedAt: Date.now() }],
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
	}

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

		const entries = lines.map((line) => {
			const [name, slug] = line.split(" [");

			return {
				slug,
				name,
				times: [],
				startedAt: undefined,
			};
		});

		setEntries(entries);
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

			<main className="py-3 space-y-3">
				{entries.map((entry) => (
					<article key={entry.slug} className="flex gap-3 items-stretch">
						<Button
							className={entry.startedAt ? "bg-red-500" : undefined}
							onClick={() => changeActiveEntryAndAddTime(entry)}
						>
							{entry.startedAt ? (
								<HiPauseCircle size={20} />
							) : (
								<HiPlayCircle size={20} />
							)}
						</Button>

						<div className="grow">
							<EntryInfo entry={entry} />
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

			<form className="flex gap-3 pb-3" onSubmit={onAddEntry}>
				<Input
					inputRef={nameInputRef}
					value={name}
					setValue={(v) => setName(v)}
					placeholder="Name"
				/>
				<div className="max-w-xs">
					<Input value={slug} setValue={(v) => setSlug(v)} placeholder="Slug" />
				</div>
				<Button>
					<HiPlusCircle size={20} />
				</Button>
			</form>
		</div>
	);
}

function sumEntriesTimes(entries: Entry[]) {
	const durations = entries.map((entry) => {
		const durations = entry.times.map((t) => t.endedAt - t.startedAt);

		if (entry.startedAt) {
			const lastDuration = Date.now() - entry.startedAt;
			durations.push(lastDuration);
		}

		return sum(durations) / 1000;
	});

	return sum(durations);
}

function TotalInfo({ entries }: { entries: Entry[] }) {
	const [totalTime, setTotalTime] = useState(() => sumEntriesTimes(entries));

	const overtime = useMemo(() => {
		const eightHoursInSeconds = 8 * 60 * 60;
		const overtime = totalTime - eightHoursInSeconds;
		return overtime > 0 ? overtime : 0;
	}, [totalTime]);

	useEffect(() => {
		setTotalTime(sumEntriesTimes(entries));

		if (!entries.some((e) => e.startedAt)) return;

		const interval = setInterval(() => {
			setTotalTime(sumEntriesTimes(entries));
		}, 1000);

		return () => clearInterval(interval);
	}, [entries]);

	return (
		<aside className="bg-gray-200 p-3 rounded-md font-mono text-sm grid grid-cols-2">
			<div>Total: {secondsToHumanFormat(totalTime)}</div>
			<div className={cn(overtime ? "text-red-500" : undefined)}>
				Overtime: {secondsToHumanFormat(overtime)}
			</div>
		</aside>
	);
}

function EntryInfo({ entry }: { entry: Entry }) {
	const [totalTime, setTotalTime] = useState(() =>
		getEntryTotalTimeInHumanFormat(entry),
	);

	useEffect(() => {
		setTotalTime(getEntryTotalTimeInHumanFormat(entry));

		if (!entry.startedAt) return;

		const interval = setInterval(() => {
			setTotalTime(getEntryTotalTimeInHumanFormat(entry));
		}, 1000);

		return () => clearInterval(interval);
	}, [entry]);

	return (
		<Input
			disabled
			value={`(${totalTime}) ${entry.name}, ${entry.slug}`}
			setValue={() => {}}
			placeholder=""
			className={cn(
				"font-mono",
				entry.startedAt ? "disabled:bg-red-500" : undefined,
			)}
		/>
	);
}

function getEntryTotalTimeInHumanFormat(entry: Entry) {
	const durations = entry.times.map((t) => t.endedAt - t.startedAt);

	if (entry.startedAt) {
		const lastDuration = Date.now() - entry.startedAt;
		durations.push(lastDuration);
	}

	const totalTimeS = sum(durations) / 1000;

	return secondsToHumanFormat(totalTimeS);
}

function secondsToHumanFormat(value: number) {
	const hours = String(Math.floor(value / 60 / 60)).padStart(2, "0");
	const minutes = String(Math.floor(value / 60) % 60).padStart(2, "0");
	const seconds = String(Math.floor(value % 60)).padStart(2, "0");

	return `${hours}:${minutes}:${seconds}`;
}

function Badge({ badgeText }: { badgeText: string }) {
	return (
		<div className="w-min rounded-full border-2 border-black bg-jagaatrack px-3 py-1.5 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none">
			{badgeText}
		</div>
	);
}

type InputProps = {
	value: string;
	setValue: React.Dispatch<React.SetStateAction<string>>;
	placeholder: string;
	disabled?: boolean;
	inputRef?: Ref<HTMLInputElement>;
	className?: string;
};

function Input({
	value,
	setValue,
	placeholder,
	disabled,
	inputRef,
	className,
}: InputProps) {
	return (
		<input
			className={cn(
				"rounded-md border-2 border-black p-[10px] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:translate-x-[3px] focus:translate-y-[3px] focus:shadow-none block disabled:bg-gray-200 w-full",
				className,
			)}
			type="text"
			name="text"
			id="text"
			placeholder={placeholder}
			value={value}
			onChange={(e) => setValue(e.target.value)}
			aria-label={placeholder}
			disabled={disabled}
			ref={inputRef}
		/>
	);
}

type ButtonProps = {
	children: React.ReactNode;
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	className?: string;
};

function Button(props: ButtonProps) {
	const { children, onClick, className } = props;
	return (
		<button
			role="button"
			aria-label="Click to perform an action"
			onClick={onClick}
			className={cn(
				"flex bg-jagaatrack cursor-pointer items-center rounded-md border-2 border-black px-3 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none",
				className,
			)}
		>
			{children}
		</button>
	);
}

function sum(items: number[]) {
	return items.reduce((acc, e) => acc + e, 0);
}

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
