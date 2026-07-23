import { getPlayerStats } from "@/app/lib/data/stats";
import type { StatsData } from "@/app/types";
import { PageTransitionWrapper } from "../components";
import { StatsClient } from "./stats-client";

// Server component to fetch initial data
export default async function StatsPage() {
	const initialData: StatsData = await getPlayerStats();

	return (
		<PageTransitionWrapper className="container mx-auto px-4 py-8">
			<StatsClient initialData={initialData} />
		</PageTransitionWrapper>
	);
}
