import { HiXMark } from "react-icons/hi2";
import { logToTextParts, useDataContext } from "./utils";

export function ProjectsLogs() {
	const { logs, removeLog } = useDataContext();

	return (
		<section className="grid gap-2 pb-3 font-mono text-xs">
			{logs.map((log) => {
				const { timestamp, name, diffHuman } = logToTextParts(log);

				return (
					<article
						key={`${log.startedAt}-${log.endedAt}`}
						className="flex items-center justify-between rounded-btn border border-base-content bg-base-200 py-2 pl-3 pr-2"
					>
						<span>
							({timestamp}) {name}
						</span>

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
