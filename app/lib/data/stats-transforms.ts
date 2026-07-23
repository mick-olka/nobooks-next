import type { StatsData } from "@/app/types";

type Scores = Record<string, Record<string, string>>;

export const SCORES_TRANSLATE: Record<string, string> = {
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
	"Horse Travel Distance": "Пройдено конем (блоків)",
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

const EXTRA_TIME_KEYS = [
	"Minutes Played",
	"Days Played",
	"Seconds Played",
	"Ticks Played",
	"Times Left",
	"Days Since Last Death",
	"Seconds Since Last Death",
	"Minutes Since Last Death",
];

export function filterEligiblePlayers(
	scores: Scores,
	minHours = 8,
): Set<string> {
	const eligible = new Set<string>();
	const hours = scores["Hours Played"];
	if (hours) {
		for (const [player, raw] of Object.entries(hours)) {
			const h = Number.parseFloat(raw);
			if (!Number.isNaN(h) && h > minHours) eligible.add(player);
		}
	}
	return eligible;
}

export function pruneToEligible(scores: Scores, eligible: Set<string>): Scores {
	const filtered: Scores = {};
	for (const [stat, players] of Object.entries(scores)) {
		filtered[stat] = { ...(players ?? {}) };
	}
	for (const key of EXTRA_TIME_KEYS) delete filtered[key];
	for (const [stat, players] of Object.entries(filtered)) {
		const kept: Record<string, string> = {};
		for (const [player, value] of Object.entries(players)) {
			if (eligible.has(player)) kept[player] = value;
		}
		filtered[stat] = kept;
	}
	return filtered;
}

export function convertDistances(source: Scores, target: Scores): void {
	for (const [key, players] of Object.entries(source)) {
		if (!key.includes("Distance")) continue;
		for (const [player, value] of Object.entries(players)) {
			const d = Number.parseInt(value, 10);
			if (!Number.isNaN(d)) {
				if (!target[key]) target[key] = {};
				target[key][player] = String(Math.floor(d / 100));
			}
		}
	}
}

export function deriveLeastDeaths(scores: Scores): void {
	const deaths = scores.Deaths;
	if (!deaths) return;
	const rows = Object.entries(deaths)
		.map(([player, raw]) => ({ player, deaths: Number.parseInt(raw, 10) }))
		.filter((r) => !Number.isNaN(r.deaths))
		.sort((a, b) => a.deaths - b.deaths);
	if (rows.length === 0) return;
	const out: Record<string, string> = {};
	for (const { player, deaths: d } of rows) out[player] = String(d);
	scores["Least Deaths"] = out;
}

export function translateScoreKeys(scores: Scores): Scores {
	return Object.fromEntries(
		Object.entries(SCORES_TRANSLATE).map(([en, uk]) => [uk, scores[en]]),
	);
}

export function computeOnline(
	playerUuids: Record<string, string>,
	onlineUuids: string[],
): Record<string, boolean> {
	const online = new Set(Array.isArray(onlineUuids) ? onlineUuids : []);
	return Object.fromEntries(
		Object.entries(playerUuids).map(([name, uuid]) => [name, online.has(uuid)]),
	);
}

export function buildStatsData(
	scores: Scores,
	onlineUuids: string[],
): StatsData {
	const eligible = filterEligiblePlayers(scores);
	const filtered = pruneToEligible(scores, eligible);
	convertDistances(scores, filtered);
	deriveLeastDeaths(filtered);
	const translated = translateScoreKeys(filtered);
	const online = computeOnline(scores["Player UUID"] ?? {}, onlineUuids);
	const playernames = Object.keys(scores["Player Name"] ?? {});
	return { online, scoreboard: { scores: translated }, playernames };
}
