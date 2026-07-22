import { describe, expect, it } from "vitest";
import {
	buildStatsData,
	computeOnline,
	convertDistances,
	deriveLeastDeaths,
	filterEligiblePlayers,
} from "@/app/lib/data/stats-transforms";

describe("filterEligiblePlayers", () => {
	it("keeps only players with more than 8 hours played", () => {
		const scores = { "Hours Played": { a: "9", b: "8", c: "12", d: "x" } };
		const eligible = filterEligiblePlayers(scores);
		expect([...eligible].sort()).toEqual(["a", "c"]);
	});
});

describe("convertDistances", () => {
	it("converts centimetres to metres (floored) for Distance keys", () => {
		const source = { "Distance Walked": { a: "250", b: "99" } };
		const target: Record<string, Record<string, string>> = {
			"Distance Walked": {},
		};
		convertDistances(source, target);
		expect(target["Distance Walked"]).toEqual({ a: "2", b: "0" });
	});
});

describe("deriveLeastDeaths", () => {
	it("adds Least Deaths sorted ascending", () => {
		const scores: Record<string, Record<string, string>> = {
			Deaths: { a: "5", b: "2", c: "9" },
		};
		deriveLeastDeaths(scores);
		expect(Object.keys(scores["Least Deaths"])).toEqual(["b", "a", "c"]);
	});
});

describe("computeOnline", () => {
	it("maps player names to online booleans by uuid", () => {
		const playerUuids = { a: "uuid-1", b: "uuid-2" };
		expect(computeOnline(playerUuids, ["uuid-2"])).toEqual({
			a: false,
			b: true,
		});
	});
});

describe("buildStatsData", () => {
	it("produces online map, translated scoreboard, and playernames", () => {
		const scores = {
			"Hours Played": { Alice: "10" },
			"Player UUID": { Alice: "uuid-1" },
			"Player Name": { Alice: "Alice" },
			Deaths: { Alice: "3" },
		};
		const result = buildStatsData(scores, ["uuid-1"]);
		expect(result.online).toEqual({ Alice: true });
		expect(result.playernames).toEqual(["Alice"]);
		// "Deaths" translates to its Ukrainian label and Alice survives the >8h filter
		expect(result.scoreboard.scores["Найбільше смертей"]).toEqual({
			Alice: "3",
		});
	});
});
