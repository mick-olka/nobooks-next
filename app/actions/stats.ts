"use server";

import { revalidatePath } from "next/cache";
import { getPlayerStats } from "@/app/lib/data/stats";
import type { StatsData } from "@/app/types";

// Server action to fetch fresh stats data
export async function fetchStatsData(): Promise<StatsData> {
	const statsData = await getPlayerStats();
	revalidatePath("/stats");
	return statsData;
}
