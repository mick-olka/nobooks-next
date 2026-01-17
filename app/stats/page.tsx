import { revalidatePath } from "next/cache";
import { PageTransitionWrapper } from "../components";
import { getPlayerStats } from "../utils/services/stats-service";
import { StatsClient } from "./stats-client";

// Server component to fetch initial data
export default async function StatsPage() {
	let initialData;
	try {
		initialData = await getPlayerStats();
	} catch (error) {
		console.error("Error loading stats page:", error);
		// Fallback to empty stats data
		initialData = {
			online: {},
			scoreboard: {
				scores: {},
			},
			playernames: [],
		};
	}

	return (
		<PageTransitionWrapper className="container mx-auto px-4 py-8">
			<StatsClient initialData={initialData} />
		</PageTransitionWrapper>
	);
}
