import { FormEvent, Ref, useRef, useState } from "react";
import {
	HiPlusCircle,
	HiPauseCircle,
	HiPlayCircle,
	HiMinusCircle,
	HiClipboardDocument,
	HiClock,
	HiTrash,
} from "react-icons/hi2";
import { useLocalStorage } from "@uidotdev/usehooks";
// @ts-expect-error - no types
import { useSound } from "use-sound";

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

export function App() {
	const [playClick] = useSound("/click.mp3");
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [entries, setEntries] = useLocalStorage<Entry[]>("entries", []);
	const nameInputRef = useRef<HTMLInputElement>(null);

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
		const newEntries = entries.filter((e) => e.name !== entry.name);
		setEntries(newEntries);
	}

	function changeActiveEntryAndAddTime(entry: Entry) {
		playClick();
		const newEntries = entries.map((e) => {
			if (e.startedAt) {
				const newEntry: Entry = {
					...e,
					times: [
						...e.times,
						{ startedAt: e.startedAt, endedAt: Date.now() + 1000 * 7 * 60 },
					],
					startedAt: undefined,
				};
				return newEntry;
			}

			if (e.name === entry.name) {
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

		const entriesExports = entries.map((entry) => {
			const durations = entry.times.map((e) => e.endedAt - e.startedAt);
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

	return (
		<div className="container max-w-2xl border-x min-h-screen flex flex-col">
			<header className="py-3 flex items-center gap-4 ">
				<Badge badgeText="Jagaatrack" />
				<strong className="mt-0.5">Why are you running?</strong>
				<div className="ml-auto flex gap-2">
					<button onClick={onFullReset}>
						<HiTrash size={20} />
					</button>
					<button onClick={onResetTimers}>
						<HiClock size={20} />
					</button>
					<button onClick={onExport}>
						<HiClipboardDocument size={20} />
					</button>
				</div>
			</header>

			<main className="py-3 space-y-3">
				{entries.map((entry) => {
					const totalTime = getEntryTotalTimeInHumanFormat(entry);
					return (
						<article key={entry.name} className="flex gap-3 items-stretch">
							<Button onClick={() => changeActiveEntryAndAddTime(entry)}>
								{entry.startedAt ? (
									<HiPauseCircle size={20} />
								) : (
									<HiPlayCircle size={20} />
								)}
							</Button>

							<div className="grow">
								<Input
									disabled
									value={`(${totalTime}) ${entry.name}, ${entry.slug}`}
									setValue={() => {}}
									placeholder=""
								/>
							</div>
							<Button onClick={() => removeEntry(entry)}>
								<HiMinusCircle size={20} />
							</Button>
						</article>
					);
				})}
			</main>

			<form className="flex gap-3" onSubmit={onAddEntry}>
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

function getEntryTotalTimeInHumanFormat(entry: Entry) {
	const durations = entry.times.map((t) => t.endedAt - t.startedAt);
	const totalTimeS = sum(durations) / 1000;
	const hours = String(Math.floor(totalTimeS / 60 / 60)).padStart(2, "0");
	const minutes = String(Math.floor(totalTimeS / 60) % 60).padStart(2, "0");
	const seconds = String(Math.floor(totalTimeS % 60)).padStart(2, "0");

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
};

function Input({
	value,
	setValue,
	placeholder,
	disabled,
	inputRef,
}: InputProps) {
	return (
		<input
			className="rounded-md border-2 border-black p-[10px] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all focus:translate-x-[3px] focus:translate-y-[3px] focus:shadow-none block disabled:bg-gray-200 w-full"
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
};

function Button({ children, onClick }: ButtonProps) {
	return (
		<button
			role="button"
			aria-label="Click to perform an action"
			onClick={onClick}
			className="flex cursor-pointer items-center rounded-md border-2 border-black bg-jagaatrack px-10 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
		>
			{children}
		</button>
	);
}

function sum(items: number[]) {
	return items.reduce((acc, e) => acc + e, 0);
}
