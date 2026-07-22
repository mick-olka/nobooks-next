"use server";

import { revalidatePath } from "next/cache";
import { serverApiFetch } from "@/app/lib/data/server-api";
import {
	buildStatsData,
	SCORES_TRANSLATE,
} from "@/app/lib/data/stats-transforms";
import type { StatsData } from "@/app/types";

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
			const translatedKey = SCORES_TRANSLATE[key] || key;
			result[translatedKey] = String(rawValue);
		}
	}

	return result;
}

export const getPlayerStats = async (retries = 2): Promise<StatsData> => {
	try {
		const [statsResponse, onlineResponse] = await Promise.all([
			serverApiFetch("/stats/all", { revalidate: 60 }),
			serverApiFetch("/online", { revalidate: 30 }),
		]);

		if (!statsResponse.ok) {
			throw new Error(
				`Failed to fetch stats: ${statsResponse.status} ${statsResponse.statusText}`,
			);
		}

		if (!onlineResponse.ok) {
			throw new Error(
				`Failed to fetch online players: ${onlineResponse.status} ${onlineResponse.statusText}`,
			);
		}

		const scores = (await statsResponse.json()) as Record<
			string,
			Record<string, string>
		>;
		const onlineUuids = (await onlineResponse.json()) as string[];

		return buildStatsData(scores, onlineUuids);
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
	const statsData = await getPlayerStats();
	revalidatePath("/stats");
	return statsData;
}

export const getPlayerIndividualStats = async (
	discordId: string,
): Promise<Record<string, string>> => {
	try {
		const accountResponse = await serverApiFetch(`/accounts/${discordId}`);

		if (!accountResponse.ok) {
			throw new Error(
				`Failed to fetch user account: ${accountResponse.status} ${accountResponse.statusText}`,
			);
		}

		const accountData = (await accountResponse.json()) as unknown;
		const uuid = findUuid(accountData);

		if (!uuid) {
			return {};
		}

		const statsResponse = await serverApiFetch(`/stats/${uuid}`);

		if (!statsResponse.ok) {
			throw new Error(
				`Failed to fetch user stats: ${statsResponse.status} ${statsResponse.statusText}`,
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
