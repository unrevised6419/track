import { createRequire } from "node:module";
import process from "node:process";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const baseConfig = require("@allindevelopers/prettier-config");

const plugins = [];

if (process.env.INCLUDE_TAILWINDCSS_PRETTIER) {
	plugins.push("prettier-plugin-tailwindcss");
}

/** @type {import("prettier").Config} */
export default {
	...baseConfig,
	plugins,
};
