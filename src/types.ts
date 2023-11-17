export type Interval = {
	startedAt: number;
	endedAt: number;
};

export type Project = {
	name: string;
	slug: string;
	times: Log[];
	startedAt?: number;
	lastActivityName?: string;
};

export type Log = Interval & {
	projectSlug: string;
	activityName: string;
};

export const projectActions = ["copy", "rename", "reset", "remove"] as const;
export type ProjectAction = (typeof projectActions)[number];
