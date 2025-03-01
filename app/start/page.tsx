import { PageTransitionWrapper } from "../components";
import { StartPane } from "./start";

export default function StartPage() {
  return (
    <PageTransitionWrapper className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-12 text-center">Початок гри</h1>
      <StartPane />
    </PageTransitionWrapper>
  );
}
