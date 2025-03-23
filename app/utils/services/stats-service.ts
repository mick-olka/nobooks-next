import type { StatsData, StatsResponse } from "@/app/types";

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
		const statsData: StatsData = {
			online: data.online,
			scoreboard: {
				scores: data.scoreboard.scores,
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
