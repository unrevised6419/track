import { HiXMark } from "react-icons/hi2";
import { logToTextParts, useDataContext } from "./utils";

export function ProjectsLogs() {
	const { logs, removeLog } = useDataContext();

	return (
		<section className="grid gap-2 font-mono text-xs pb-3">
			{logs.map((log) => {
				const { timestamp, name, diffHuman } = logToTextParts(log);

				return (
					<article
						key={`${log.startedAt}-${log.endedAt}`}
						className="bg-base-200 border border-base-content pl-3 pr-2 py-2 rounded-btn flex justify-between items-center"
					>
						<span>
							({timestamp}) {name}
						</span>

						<div className="flex items-center gap-1">
							<strong>{diffHuman}</strong>
							<button
								className="btn btn-xs btn-square btn-ghost"
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
