import { useEffect, useMemo } from "react";
import { useSound } from "use-sound";
import { msToHumanFormat, cn, useLiveTotalTime, storageKey } from "./utils";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useDataContext } from "./data-context";

export function TotalInfo() {
	const { projects } = useDataContext();
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
		<aside className="grid grid-cols-2 rounded-btn bg-base-200 px-3.5 py-3 font-mono text-sm">
			<div>Total: {totalTimeHuman}</div>
			<div className={cn(overtime ? "text-error" : undefined)}>
				Overtime: {overtimeHuman}
			</div>
		</aside>
	);
}
