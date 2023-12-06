import { useState, useRef, FormEvent } from "react";
import { HiPlusCircle } from "react-icons/hi2";
import { Button } from "./Button";
import { Input } from "./Input";
import { useDataContext, useWithClick } from "./utils";

export function AddForm() {
	const { projects, addProject } = useDataContext();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const nameInputRef = useRef<HTMLInputElement>(null);

	const onAddProject = useWithClick((e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!name || !slug) return;
		if (projects.find((p) => p.slug === slug)) return;

		addProject({ name, slug });

		setName("");
		setSlug("");
		nameInputRef.current?.focus();
	});

	return (
		<form className="flex gap-3 pt-3" onSubmit={onAddProject}>
			<Input
				inputRef={nameInputRef}
				value={name}
				setValue={(v) => {
					setName(v);
				}}
				placeholder="Name"
				className="grow"
			/>
			<Input
				value={slug}
				setValue={(v) => {
					setSlug(v);
				}}
				placeholder="Slug"
				className="w-[108px]"
			/>
			<Button>
				<HiPlusCircle size={20} />
			</Button>
		</form>
	);
}
