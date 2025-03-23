"use server";

import type { StatsData, StatsResponse } from "@/app/types";
import { revalidatePath } from "next/cache";

/**
 * Format seconds into days, hours, minutes format
 */
function formatTimeFromSeconds(seconds: number): string {
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);

	let result = "";
	if (days > 0) result += `${days}d `;
	if (hours > 0) result += `${hours}h `;
	if (minutes > 0) result += `${minutes}m`;

	return result.trim();
}

export const getPlayerStats = async (): Promise<StatsData> => {
	try {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_STATS_URL}/stats.json`,
		);

		if (!response.ok) {
			throw new Error(
				`Failed to fetch stats: ${response.status} ${response.statusText}`,
			);
		}

		const data: StatsResponse = await response.json();

		// Filter out time-related scores and add a single Time Played score
		const filteredScores = { ...data.scoreboard.scores };

		// Time-related keys to remove
		const timeRelatedKeys = [
			"Minutes Played",
			"Hours Played",
			"Days Played",
			"Seconds Played",
			"Ticks Played",
			"Times Left",
			"Days Since Last Death",
			"Seconds Since Last Death",
			"Minutes Since Last Death",
			"Hours Since Last Death",
		];

		// Remove extra time-related keys
		for (const key of timeRelatedKeys) {
			delete filteredScores[key];
		}
		// Convert all distance measurements from centimeters to meters
		for (const [key, playerScores] of Object.entries(data.scoreboard.scores)) {
			if (key.includes("Distance")) {
				for (const [player, value] of Object.entries(playerScores)) {
					const distance = Number.parseInt(value);
					if (!Number.isNaN(distance)) {
						filteredScores[key][player] = String(Math.floor(distance / 100));
					}
				}
			}
		}

		const statsData: StatsData = {
			online: data.online,
			scoreboard: {
				scores: filteredScores,
			},
			playernames: data.playernames,
		};
		return statsData;
	} catch (error) {
		console.error("Error fetching player stats:\n", error);
		return {
			online: {},
			scoreboard: {
				scores: {},
			},
			playernames: [],
		};
	}
};

// Server action to fetch fresh stats data
export async function fetchStatsData() {
	"use server";
	const statsData = await getPlayerStats();
	revalidatePath("/stats");
	return statsData;
}
