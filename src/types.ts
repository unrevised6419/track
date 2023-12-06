export type Project = {
	readonly name: string;
	readonly slug: string;
};

export type StartedLog = {
	readonly projectSlug: string;
	readonly activityName: string;
	readonly startedAt: number;
};

export type IntervalOld = readonly [start: number, end: number];
export type Interval = {
	readonly startedAt: number;
	readonly endedAt: number;
};
export type Log = {
	readonly projectSlug: string;
	readonly activityName: string;
	/** @deprecated */
	readonly interval?: IntervalOld;
	readonly startedAt: number;
	readonly endedAt: number;
};

export const projectActions = ["copy", "rename", "reset", "remove"] as const;
export type ProjectAction = (typeof projectActions)[number];
