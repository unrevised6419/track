export type Interval = {
	startedAt: number;
	endedAt: number;
};

/**
 * TODO: Remove or combine with {@link Log} type
 */
export type Time = Interval & {
	activityName?: string;
};

export type Project = {
	name: string;
	slug: string;
	times: Time[];
	startedAt?: number;
	lastActivityName?: string;
};

export type Log = Interval & {
	project: Project;
	activityName: string;
};

export const projectActions = ["copy", "rename", "reset", "remove"] as const;
export type ProjectAction = (typeof projectActions)[number];
