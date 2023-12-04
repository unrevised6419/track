import { logToTextParts, useDataContext } from "./utils";

export function ProjectsLogs() {
	const { logs } = useDataContext();
	return (
		<section className="grid gap-2 font-mono text-xs pb-3 max-h-96 overflow-y-auto">
			{logs.map((log) => {
				const { timestamp, name, diffHuman } = logToTextParts(log);

				return (
					<article
						key={log.interval.toString()}
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
