export type Project = {
	name: string;
	slug: string;
	startedAt?: number;
	lastActivityName?: string;
};

export type StartedProject = Project & {
	startedAt: number;
};

export type Interval = readonly [start: number, end: number];
export type Log = {
	projectSlug: string;
	activityName: string;
	interval: Interval;
};

export const projectActions = ["copy", "rename", "reset", "remove"] as const;
export type ProjectAction = (typeof projectActions)[number];
