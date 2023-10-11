/**
 * TODO: Remove or combine with {@link Log} type
 */
export type Time = {
	startedAt: number;
	endedAt: number;
	activityName?: string;
};

export type Entry = {
	name: string;
	slug: string;
	times: Time[];
	startedAt?: number;
	lastActivityName?: string;
};

export type Log = {
	startedAt: number;
	endedAt: number;
	entry: Entry;
	activityName: string;
};
