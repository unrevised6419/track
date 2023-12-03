import { Plugin } from "vite";
import { execSync } from "node:child_process";

const hash = execSync("git rev-parse --short HEAD").toString().trim();
const date = execSync("date -Iseconds").toString().trim();

const virtualModuleId = "virtual:local";
const resolvedVirtualModuleId = "\0" + virtualModuleId;

export default function localPlugin(): Plugin {
	return {
		name: "vite-plugin-local",
		resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				return [
					`export const hash = ${JSON.stringify(hash)}`,
					`export const date = ${JSON.stringify(date)}`,
				].join("\n");
			}
		},
	};
}
