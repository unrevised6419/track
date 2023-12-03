import { useEffect, useMemo } from "react";
// @ts-expect-error - no types
import { useSound } from "use-sound";
import {
	msToHumanFormat,
	cn,
	useLiveTotalTime,
	storageKey,
	useAppContext,
} from "./utils";
import { useLocalStorage } from "@uidotdev/usehooks";

export function TotalInfo() {
	const { projects } = useAppContext();
	const [playAlarm] = useSound("/call-to-attention.mp3");
	const [alarmSoundWasPlayed, setAlarmSoundWasPlayed] = useLocalStorage(
		storageKey("alarm-sound-was-played"),
		false,
	);

	const totalTime = useLiveTotalTime(projects);
	const totalTimeHuman = useMemo(() => msToHumanFormat(totalTime), [totalTime]);

	const overtime = useMemo(() => {
		const eightHoursInMs = 8 * 60 * 60 * 1000;
		const overtime = totalTime - eightHoursInMs;
		return overtime > 0 ? overtime : 0;
	}, [totalTime]);

	const overtimeHuman = useMemo(() => msToHumanFormat(overtime), [overtime]);

	const h7m50inMs = 7 * 60 * 60 * 1000 + 50 * 60 * 1000;
	const shouldAlarm = totalTime > h7m50inMs;

	useEffect(() => {
		if (!alarmSoundWasPlayed && shouldAlarm) playAlarm();
		setAlarmSoundWasPlayed(shouldAlarm);
	}, [alarmSoundWasPlayed, playAlarm, setAlarmSoundWasPlayed, shouldAlarm]);

	return (
		<aside className="bg-gray-200 p-3 rounded-md font-mono text-sm grid grid-cols-2">
			<div>Total: {totalTimeHuman}</div>
			<div className={cn(overtime ? "text-red-500" : undefined)}>
				Overtime: {overtimeHuman}
			</div>
		</aside>
	);
}
