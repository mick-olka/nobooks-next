import { PageTransitionWrapper } from "../components";
import { Stats } from "./stats";

export default function StatsPage() {
  return (
    <PageTransitionWrapper className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-12 text-center">
        Статистика гравців
      </h1>
      <Stats />
    </PageTransitionWrapper>
  );
}
