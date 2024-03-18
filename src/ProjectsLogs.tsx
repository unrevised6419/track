import { HiXMark } from "react-icons/hi2";
import { logToTextParts } from "./utils";
import { useDataContext } from "./data-context";

export function ProjectsLogs() {
	const { logs, removeLog } = useDataContext();

	return (
		<section className="grid gap-2 pb-3 font-mono text-xs">
			{logs.map((log) => {
				const { timestamp, name, diffHuman } = logToTextParts(log);

				return (
					<article
						key={`${String(log.startedAt)}-${String(log.endedAt)}`}
						className="flex items-center justify-between gap-2 overflow-hidden rounded-btn border border-base-content bg-base-200 py-2 pl-3 pr-2"
					>
						<span className="whitespace-nowrap">({timestamp})</span>
						<span className="grow truncate whitespace-nowrap">{name}</span>

						<div className="flex items-center gap-1">
							<strong>{diffHuman}</strong>
							<button
								className="btn btn-square btn-ghost btn-xs"
								onClick={() => {
									removeLog(log);
								}}
							>
								<HiXMark />
							</button>
						</div>
					</article>
				);
			})}
		</section>
	);
}
