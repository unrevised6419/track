export type Time = {
	startedAt: number;
	endedAt: number;
};

export type Entry = {
	name: string;
	slug: string;
	times: Time[];
	startedAt?: number;
};

export type Log = {
	startedAt: number;
	endedAt: number;
	entry: Entry;
};
