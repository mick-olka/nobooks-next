import { PageTransitionWrapper } from "../components";
import { getPlayerStats } from "../utils/services";
import { HallOfFame } from "./hall-of-fame";

export default async function StatsPage() {
  const statsData = await getPlayerStats();
  return (
    <PageTransitionWrapper className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold my-8 text-center">🎖️ Стіна слави 🎖️</h1>
      <HallOfFame data={statsData} />
    </PageTransitionWrapper>
  );
}
