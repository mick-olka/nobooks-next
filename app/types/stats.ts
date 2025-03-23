export interface StatsResponse {
	online: Record<string, boolean>;
	scoreboard: {
		entries: string[];
		columns: string[];
		scores: Record<string, Record<string, string>>;
	};
	playernames: string[];
	units: Record<string, string>;
}

export interface StatsData {
	online: Record<string, boolean>;
	scoreboard: {
		scores: Record<string, Record<string, string>>;
	};
	playernames: string[];
}
