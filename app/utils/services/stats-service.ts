"use server";

import type { StatsData } from "@/app/types";
import { revalidatePath } from "next/cache";

const scoresTranslate = {
  "Hours Played": "Зіграно годин",
  "Hours Since Last Death": "Остання смерть (годин тому)",
  Deaths: "Найбільше смертей",
  "Least Deaths": "Найменше смертей",
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

const API_BASE_URL = "https://api.noboobs.world";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findUuid(value: unknown): string | null {
  if (typeof value === "string" && UUID_REGEX.test(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nestedUuid = findUuid(item);
      if (nestedUuid) return nestedUuid;
    }
    return null;
  }

  if (isRecord(value)) {
    for (const nestedValue of Object.values(value)) {
      const nestedUuid = findUuid(nestedValue);
      if (nestedUuid) return nestedUuid;
    }
  }

  return null;
}

function toStatsMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }

  const candidateKeys = ["stats", "scoreboard", "scores", "data"];
  for (const key of candidateKeys) {
    const nested = value[key];
    if (isRecord(nested)) {
      const nestedStats = toStatsMap(nested);
      if (Object.keys(nestedStats).length > 0) {
        return nestedStats;
      }
    }
  }

  const result: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (
      typeof rawValue === "string" ||
      typeof rawValue === "number" ||
      typeof rawValue === "boolean"
    ) {
      const translatedKey = scoresTranslate[key as keyof typeof scoresTranslate] || key;
      result[translatedKey] = String(rawValue);
    }
  }

  return result;
}

export const getPlayersUUIDS = async (): Promise<Record<string, string>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/stats/all`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Next.js Server)",
      },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch UUIDs: ${response.status} ${response.statusText}`
      );
    }
    const data = (await response.json()) as Record<string, Record<string, string>>;
    const playersIds = data["Player UUID"];
    return playersIds || {};
  } catch (error) {
    console.error("Error fetching player UUIDs:", error);
    return {};
  }
};

export const getDiscordIds = async (): Promise<Record<string, string>> => {
  return {};
};

export const getPlayerStats = async (retries = 2): Promise<StatsData> => {
  try {
    const [statsResponse, onlineResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/stats/all`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Next.js Server)",
        },
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      }),
      fetch(`${API_BASE_URL}/online`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Next.js Server)",
        },
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      }),
    ]);

    if (!statsResponse.ok) {
      throw new Error(
        `Failed to fetch stats: ${statsResponse.status} ${statsResponse.statusText}`
      );
    }

    if (!onlineResponse.ok) {
      throw new Error(
        `Failed to fetch online players: ${onlineResponse.status} ${onlineResponse.statusText}`
      );
    }

    const scores = (await statsResponse.json()) as Record<
      string,
      Record<string, string>
    >;
    const onlineUuids = (await onlineResponse.json()) as string[];
    const onlineUuidSet = new Set(
      Array.isArray(onlineUuids) ? onlineUuids : []
    );

    // Filter out time-related scores and add a single Time Played score
    const filteredScores: Record<string, Record<string, string>> = {};
    for (const [statName, playerScores] of Object.entries(scores)) {
      filteredScores[statName] = { ...(playerScores || {}) };
    }

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

    // Filter players based on "Hours Played" - only include players with more than 2 hours
    const hoursPlayedData = scores["Hours Played"];
    const eligiblePlayers = new Set<string>();

    if (hoursPlayedData) {
      for (const [player, hoursStr] of Object.entries(hoursPlayedData)) {
        const hours = Number.parseFloat(hoursStr);
        if (!Number.isNaN(hours) && hours > 8) {
          eligiblePlayers.add(player);
        }
      }
    }

    // Filter all scores to only include eligible players
    for (const [statName, playerScores] of Object.entries(filteredScores)) {
      const filteredPlayerScores: Record<string, string> = {};
      for (const [player, value] of Object.entries(playerScores)) {
        if (eligiblePlayers.has(player)) {
          filteredPlayerScores[player] = value;
        }
      }
      filteredScores[statName] = filteredPlayerScores;
    }

    // Convert all distance measurements from centimeters to meters
    for (const [key, playerScores] of Object.entries(scores)) {
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

    // Calculate custom "Least Deaths" statistic
    if (filteredScores.Deaths) {
      const deathsData = filteredScores.Deaths;
      const playersWithDeaths: Array<{ player: string; deaths: number }> = [];

      // Collect all players with their death counts
      for (const [player, deathsStr] of Object.entries(deathsData)) {
        const deaths = Number.parseInt(deathsStr);
        if (!Number.isNaN(deaths)) {
          playersWithDeaths.push({ player, deaths });
        }
      }

      // Sort by deaths (ascending) and take top 3
      playersWithDeaths.sort((a, b) => a.deaths - b.deaths);
      // const top3LeastDeaths = playersWithDeaths.slice(0, 3);

      // Create the "Least Deaths" statistic
      if (playersWithDeaths.length > 0) {
        const leastDeathsData: Record<string, string> = {};
        for (const { player, deaths } of playersWithDeaths) {
          leastDeathsData[player] = String(deaths);
        }
        filteredScores["Least Deaths"] = leastDeathsData;
      }
    }

    const translatedScores = Object.fromEntries(
      Object.entries(scoresTranslate).map(([key, value]) => [
        value,
        filteredScores[key],
      ])
    );

    const playerUuids = scores["Player UUID"] || {};
    const onlineByPlayerName = Object.fromEntries(
      Object.entries(playerUuids).map(([playerName, uuid]) => [
        playerName,
        onlineUuidSet.has(uuid),
      ])
    );

    const playernames = Object.keys(scores["Player Name"] || {});

    const statsData: StatsData = {
      online: onlineByPlayerName,
      scoreboard: {
        scores: translatedScores,
      },
      playernames,
    };
    return statsData;
  } catch (error) {
    console.error("Error fetching player stats:\n", error);

    // Retry on network errors (including TimeoutError)
    const isNetworkError =
      error instanceof TypeError ||
      error instanceof DOMException || // TimeoutError is a DOMException
      (error instanceof Error && error.name === "TimeoutError") ||
      (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "UND_ERR_SOCKET");

    if (retries > 0 && isNetworkError) {
      console.log(`Retrying stats fetch... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      return getPlayerStats(retries - 1);
    }

    // Return empty stats data as fallback
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

export const getPlayerIndividualStats = async (
  discordId: string
): Promise<Record<string, string>> => {
  try {
    const accountResponse = await fetch(`${API_BASE_URL}/accounts/${discordId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Next.js Server)",
      },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });

    if (!accountResponse.ok) {
      throw new Error(
        `Failed to fetch user account: ${accountResponse.status} ${accountResponse.statusText}`
      );
    }

    const accountData = (await accountResponse.json()) as unknown;
    const uuid = findUuid(accountData);

    if (!uuid) {
      return {};
    }

    const statsResponse = await fetch(`${API_BASE_URL}/stats/${uuid}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Next.js Server)",
      },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });

    if (!statsResponse.ok) {
      throw new Error(
        `Failed to fetch user stats: ${statsResponse.status} ${statsResponse.statusText}`
      );
    }

    const statsPayload = (await statsResponse.json()) as unknown;
    const normalizedStats = toStatsMap(statsPayload);

    if (Object.keys(normalizedStats).length === 0) {
      return {};
    }

    return normalizedStats;
  } catch (error) {
    console.error("Error fetching player individual stats:", error);
    return {};
  }
};
