import { PageTransitionWrapper } from "@/app/components";

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { FeaturesPane } from "./features-pane";

const getFeaturesData = () => {
  const dataDir = path.join(process.cwd(), "app/features/data");
  const files = readdirSync(dataDir).filter((file) => file.endsWith(".md"));

  return files.map((filename) => {
    const content = readFileSync(path.join(dataDir, filename), "utf-8");
    return content;
  });
};

const featuresData = getFeaturesData();

export default function FeaturesPage() {
  return (
    <PageTransitionWrapper className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-12">
        no boobs Зимовий - Особливості серверу
      </h1>
      <FeaturesPane featuresData={featuresData} />
    </PageTransitionWrapper>
  );
}
