import { Dispatch, SetStateAction, useState, useRef, FormEvent } from "react";
import { HiPlusCircle } from "react-icons/hi2";
import { Button } from "./Button";
import { Input } from "./Input";
import { Entry } from "./types";
import { usePlayClick } from "./utils";

export function AddForm({
	entries,
	setEntries,
}: {
	entries: Entry[];
	setEntries: Dispatch<SetStateAction<Entry[]>>;
}) {
	const playClick = usePlayClick();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const nameInputRef = useRef<HTMLInputElement>(null);

	function onAddEntry(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();

		playClick();

		if (!name || !slug) return;
		if (entries.find((entry) => entry.slug === slug)) return;

		setEntries([{ name, slug: slug, times: [] }, ...entries]);
		setName("");
		setSlug("");
		nameInputRef.current?.focus();
	}

	return (
		<form className="flex gap-3 pt-3" onSubmit={onAddEntry}>
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
	);
}
