export type Project = {
	readonly name: string;
	readonly slug: string;
	readonly startedAt?: number;
	readonly lastActivityName?: string;
};

export type StartedProject = Project & {
	readonly startedAt: number;
};

export type Interval = readonly [start: number, end: number];
export type Log = {
	readonly projectSlug: string;
	readonly activityName: string;
	readonly interval: Interval;
};

export const projectActions = ["copy", "rename", "reset", "remove"] as const;
export type ProjectAction = (typeof projectActions)[number];
