export type Project = {
	readonly name: string;
	readonly slug: string;
};

export type StartedLog = {
	readonly projectSlug: string;
	readonly activityName: string;
	readonly startedAt: number;
};

export type Interval = {
	readonly startedAt: number;
	readonly endedAt: number;
};

export type Log = {
	readonly projectSlug: string;
	readonly activityName: string;
	readonly startedAt: number;
	readonly endedAt: number;
};

export type Activity = {
	readonly name: string;
	readonly projectSlug: string;
};

export const projectActions = ["copy", "rename", "reset", "remove"] as const;
export type ProjectAction = (typeof projectActions)[number];
