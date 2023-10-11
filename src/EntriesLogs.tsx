import { useMemo } from "react";
import { Entry } from "./types";
import { entriesToLogs, logToTextParts } from "./utils";

export function EntriesLogs({ entries }: { entries: Entry[] }) {
	const logs = useMemo(() => entriesToLogs(entries, { sort: true }), [entries]);

	return (
		<section className="grid gap-2 font-mono text-xs pb-3 max-h-96 overflow-y-auto">
			{logs.map((log) => {
				const { timestamp, name, diffHuman } = logToTextParts(log);

				return (
					<article
						key={log.startedAt}
						className="bg-gray-200 px-3 py-2 rounded-md flex justify-between"
					>
						<span>
							({timestamp}) {name}
						</span>
						<strong>{diffHuman}</strong>
					</article>
				);
			})}
		</section>
	);
}
