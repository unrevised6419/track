import { parseEnv } from "znv";
import { z } from "zod";

const envSchema = {
	VITE_SUPABASE_URL: z.string().url(),
	VITE_SUPABASE_KEY: z.string().min(1),
};

export const { VITE_SUPABASE_URL, VITE_SUPABASE_KEY } = parseEnv(
	import.meta.env,
	envSchema,
);
