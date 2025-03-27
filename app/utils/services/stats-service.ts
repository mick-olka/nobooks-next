"use server";

import type { StatsData, StatsResponse } from "@/app/types";
import { revalidatePath } from "next/cache";

const scoresTranslate = {
	"Hours Played": "Зіграно годин",
	"Hours Since Last Death": "Остання смерть (годин тому)",
	Deaths: "Кількість смертей",
	// "Blocks Placed": "Поставлено блоків (шт.)",
	"Damage Dealt": "Завдано шкоди",
	"Damage Taken": "Отримано шкоди",
	"Times Slept": "Ночей проспано",
	"Player Kills": "Вбито гравців",
	"Crafting Table Uses": "Використано крафт-стіл",
	Jumps: "Кількість стрибків",
	"Distance Fallen": "Відстань падіння (блоків)",
	"Distance Walked": "Пройдено відстань (блоків)",
	"Distance Climbed": "Відстань підйому (блоків)",
	"Distance Sprinted": "Відстань у бігу (блоків)",
	"Distance Flown": "Відстань в польоті (блоків)",
	"Distance Swum": "Відстань вплав (блоків)",
	"Distance Crouched": "Відстань крадькома (блоків)",
	"Minecart Travel Distance": "Відстань у вагонетці (блоків)",
	"Sneak Time": "Час крадькома (сек.)",
	"Note Blocks Played": "Зіграно на нотних блоках",
	"Boat Travel Distance": "Відстань на човні (блоків)",
	"Villagers Talked To": "Взаємодій з селянами",
	"Dispensers Inspected": "Взаємодій з роздавачами",
	"Brewing Stand Interactions": "Взаємодій з варильною стійкою",
	"Chests Opened": "Відкрито скринь",
	"Flowers Potted": "Посаджено квітів у горщики",
	"Records Played": "Використано платівок",
	"Animals Bred": "Розмножено тварин",
	"Trades with Villagers": "Торгівель з селянами",
	"Items Enchanted": "Зачаровано предметів",
	"Ender Chests Opened": "Відкрито ендер-скринь",
	"Horse Travel Distance": "Пройдено відстань конем (блоків)",
	"Fish Caught": "Спіймано риби",
	"Note Blocks Tuned": "Налаштовано нотних блоків",
	"Furnaces Used": "Використано печей",
	"Droppers Inspected": "Взаємодій з роздавачами",
	"Banners Cleaned": "Очищено банерів",
	"Trapped Chests Triggered": "Відкрито скринь-пасток",
	"Cauldrons Filled": "Наповнено чанів",
	"Hoppers Inspected": "Взаємодій з воронками",
	"Cake Slices Eaten": "З'їдено шматків торту",
	"Cauldrons Used": "Використано чанів",
	"Armor Cleaned": "Очищено броні",
};

export const getPlayersUUIDS = async (): Promise<Record<string, string>> => {
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_STATS_URL}/stats.json`,
	);
	const data: StatsResponse = await response.json();
	const playersIds = data.scoreboard.scores["Player UUID"];
	return playersIds;
};

export const getDiscordIds = async (): Promise<Record<string, string>> => {
	const response = await fetch("https://map.noboobs.world:3140/accounts.aof");
	const text = await response.text();
	const lines = text.split("\n");
	const accounts: Record<string, string> = {};

	for (const line of lines) {
		if (!line) continue;
		const [uuid, discordId] = line.split(" ");
		if (uuid && discordId) {
			accounts[uuid] = discordId;
		}
	}

	return accounts;
};

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
		const extraScores = [
			"Minutes Played",
			// "Hours Played",
			"Days Played",
			"Seconds Played",
			"Ticks Played",
			"Times Left",
			"Days Since Last Death",
			"Seconds Since Last Death",
			"Minutes Since Last Death",
			// "Hours Since Last Death",
		];

		// Remove extra time-related keys
		for (const key of extraScores) {
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
			// if (key.includes("Time")) {
			// 	// Initialize the object if it doesn't exist
			// 	if (!filteredScores[key]) filteredScores[key] = {};
			// 	for (const [player, value] of Object.entries(playerScores)) {
			// 		if (value) {
			// 			const time = value
			// 				.replace("w", "т")
			// 				.replace("d", "д")
			// 				.replace("h", "г")
			// 				.replace("m", "хв")
			// 				.replace("s", "c");
			// 			filteredScores[key][player] = time;
			// 		}
			// 	}
			// }
		}

		const translatedScores = Object.fromEntries(
			Object.entries(scoresTranslate).map(([key, value]) => [
				value,
				filteredScores[key],
			]),
		);

		const statsData: StatsData = {
			online: data.online,
			scoreboard: {
				scores: translatedScores,
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

export const getPlayerIndividualStats = async (discordId: string) => {
	const discordIds = await getDiscordIds();
	const uuid = discordIds[discordId];
	const playersUUIDS = await getPlayersUUIDS();
	const playerName = Object.keys(playersUUIDS).find(
		(key) => playersUUIDS[key] === uuid,
	);
	const {
		scoreboard: { scores },
	} = await getPlayerStats();
	const playerIndividualStats: Record<string, string> = {};
	if (!playerName) return playerIndividualStats;
	for (const [key, value] of Object.entries(scores)) {
		if (value) {
			const userStat = value[playerName];
			playerIndividualStats[key] = userStat;
		}
	}
	return playerIndividualStats;
};
