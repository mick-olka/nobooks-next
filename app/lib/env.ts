import { z } from "zod";
import { AppError } from "./errors";

const schema = z.object({
	NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
	NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
	NEXT_PUBLIC_APP_URL: z.string().url(),
	NEXT_PUBLIC_STATS_URL: z.string().url().optional(),
	SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
	CRON_SECRET: z.string().min(1).optional(),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
	const result = schema.safeParse(source);
	if (!result.success) {
		const issues = result.error.issues
			.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
			.join("; ");
		throw new AppError(`Invalid environment: ${issues}`);
	}
	return result.data;
}

export const env: Env = parseEnv(process.env);
