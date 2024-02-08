import {
	HiPauseCircle,
	HiPlayCircle,
	HiBars3BottomLeft,
} from "react-icons/hi2";
import { Button } from "./Button";
import { ProjectActions } from "./ProjectActions";
import { ProjectInfo } from "./ProjectInfo";
import { IntervalOld, Project, ProjectAction } from "./types";
import { cn, useDataContext } from "./utils";

type ProjectRowProps = {
	project: Project;
	projectButtons: ProjectAction[];
	intervalMinutes: number;
	timelineLength: number;
	constraints: IntervalOld;
	order: number;
};

export function ProjectRow({
	project,
	projectButtons,
	intervalMinutes,
	timelineLength,
	constraints,
	order,
}: ProjectRowProps) {
	const { toggleActiveProject, getProjectStartedLogs } = useDataContext();

	const isStarted = getProjectStartedLogs(project).length > 0;

	return (
		<article key={project.slug} className="flex gap-3">
			<Button
				className={isStarted ? "btn-error" : undefined}
				onClick={() => {
					toggleActiveProject(project);
				}}
			>
				{isStarted ? <HiPauseCircle size={20} /> : <HiPlayCircle size={20} />}
			</Button>

			<div className="relative grow">
				<div className="absolute inset-y-0 left-2 hidden items-center sm:flex">
					<button
						className={cn("js-handle p-2", isStarted && "text-error-content")}
					>
						<HiBars3BottomLeft />
					</button>
				</div>
				<ProjectInfo project={project} />
				<div className="absolute inset-y-0 right-4 hidden items-center lg:flex">
					{order <= 9 && (
						<kbd className="kbd kbd-sm border-primary">{order}</kbd>
					)}
				</div>
			</div>

			<ProjectActions
				project={project}
				actions={projectButtons}
				index={order}
				toggleActiveProject={toggleActiveProject}
				intervalMinutes={intervalMinutes}
				timelineLength={timelineLength}
				constraints={constraints}
			/>
		</article>
	);
}
