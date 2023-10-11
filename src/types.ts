/**
 * TODO: Remove or combine with {@link Log} type
 */
export type Time = {
	startedAt: number;
	endedAt: number;
	activityName?: string;
};

export type Project = {
	name: string;
	slug: string;
	times: Time[];
	startedAt?: number;
	lastActivityName?: string;
};

export type Log = {
	startedAt: number;
	endedAt: number;
	project: Project;
	activityName: string;
};
