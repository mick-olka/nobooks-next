import { PageTransitionWrapper } from "@/app/components";

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { FaqPane } from "./faq-pane";

const getFaqData = () => {
	const dataDir = path.join(process.cwd(), "app/faq/data");
	const files = readdirSync(dataDir).filter((file) => file.endsWith(".md"));

	return files.map((filename) => {
		const content = readFileSync(path.join(dataDir, filename), "utf-8");
		return content;
	});
};

const faqData = getFaqData();

export default function FaqPage() {
	return (
		<PageTransitionWrapper className="container mx-auto px-4 py-8">
			<h1 className="text-4xl font-bold mb-12">Часті питання</h1>
			<FaqPane featuresData={faqData} />
		</PageTransitionWrapper>
	);
}
