import { useEffect } from "react";
import { useSound } from "use-sound";
import {
	msToHumanFormat,
	cn,
	useLiveTotalTime,
	msToMachineFormat,
	useAppLocalStorage,
} from "./utils";
import { useDocumentTitle } from "@uidotdev/usehooks";
import { useDataContext } from "./data.context";

const h8inMs = 8 * 60 * 60 * 1000;
const m10inMs = 10 * 60 * 1000;
const h7m50inMs = h8inMs - m10inMs;

export function TotalInfo() {
	const { projects, hasStartedLogs } = useDataContext();
	const [playAlarm] = useSound("/call-to-attention.mp3");
	const [alarmSoundWasPlayed, setAlarmSoundWasPlayed] = useAppLocalStorage(
		"alarm-sound-was-played",
		false,
	);

	const totalTime = useLiveTotalTime(projects);
	const overtime = Math.max(0, totalTime - h8inMs);
	const humanTotalTime = msToHumanFormat(totalTime);
	const humanOvertime = msToHumanFormat(overtime);
	const machineTotalTime = msToMachineFormat({ ms: totalTime, unit: "hours" });
	const machineOvertime = msToMachineFormat({ ms: overtime, unit: "hours" });

	const shouldAlarm = totalTime > h7m50inMs;

	useEffect(() => {
		if (!alarmSoundWasPlayed && shouldAlarm) playAlarm();
		setAlarmSoundWasPlayed(shouldAlarm);
	}, [alarmSoundWasPlayed, playAlarm, setAlarmSoundWasPlayed, shouldAlarm]);

	useDocumentTitle(hasStartedLogs ? humanTotalTime : "Track");

	return (
		<aside className="grid min-h-12 items-center rounded-btn bg-base-200 px-3.5 py-3 font-mono text-xs sm:grid-cols-2 md:text-sm">
			<div className="space-x-2">
				<span>Total: {humanTotalTime}</span>
				<span>({machineTotalTime}h)</span>
			</div>
			<div className={cn("space-x-2", overtime ? "text-error" : undefined)}>
				<span>Overtime: {humanOvertime}</span>
				<span>({machineOvertime}h)</span>
			</div>
		</aside>
	);
}
