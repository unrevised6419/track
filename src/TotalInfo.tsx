import { useEffect, useMemo } from "react";
import { useSound } from "use-sound";
import {
	msToHumanFormat,
	cn,
	useLiveTotalTime,
	storageKey,
	msToMachineFormat,
} from "./utils";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useDataContext } from "./data-context";

const h8inMs = 8 * 60 * 60 * 1000;
const m10inMs = 10 * 60 * 1000;
const h7m50inMs = h8inMs - m10inMs;

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
		const overtime = totalTime - h8inMs;
		return overtime > 0 ? overtime : 0;
	}, [totalTime]);

	const overtimeHuman = useMemo(() => msToHumanFormat(overtime), [overtime]);

	const shouldAlarm = totalTime > h7m50inMs;

	useEffect(() => {
		if (!alarmSoundWasPlayed && shouldAlarm) playAlarm();
		setAlarmSoundWasPlayed(shouldAlarm);
	}, [alarmSoundWasPlayed, playAlarm, setAlarmSoundWasPlayed, shouldAlarm]);

	return (
		<aside className="grid min-h-12 items-center rounded-btn bg-base-200 px-3.5 py-3 font-mono text-xs sm:grid-cols-2 md:text-sm">
			<div className="space-x-2">
				<span>Total: {totalTimeHuman}</span>
				<span>({msToMachineFormat({ ms: totalTime, unit: "hours" })}h)</span>
			</div>
			<div className={cn("space-x-2", overtime ? "text-error" : undefined)}>
				<span>Overtime: {overtimeHuman}</span>
				<span>({msToMachineFormat({ ms: overtime, unit: "hours" })}h)</span>
			</div>
		</aside>
	);
}
