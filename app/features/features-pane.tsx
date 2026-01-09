"use client";

import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { AdminButtons } from "../components";
import type { WikiPage } from "../types";
import { useSectionsWithHash } from "../utils/hooks/use-hash-link";

export const FeaturesPane = ({
	featuresData,
	isAdmin,
}: {
	featuresData: WikiPage[];
	isAdmin: boolean;
}) => {
	const { openSection, handleSectionClick } = useSectionsWithHash();

	return (
		<>
			{featuresData.map((section) => (
				<div key={section.id} className="mb-8" id={section.id}>
					<details
						className="cursor-pointer group"
						open={section.id === openSection}
					>
						<summary
							className="text-2xl font-semibold mb-4 list-none"
							onClick={(e) => {
								e.preventDefault();
								handleSectionClick(section.id);
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handleSectionClick(section.id);
								}
							}}
							tabIndex={0}
						>
							<div className="relative">
								{isAdmin && <AdminButtons id={section.url_name} />}
							</div>
							<span className="flex items-center">
								<svg
									className="w-6 h-6 mr-2 transition-transform duration-300 group-open:rotate-90"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<title>Arrow icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>

								<div className="markdown">
									<Markdown>{section.title}</Markdown>
								</div>
							</span>
						</summary>
						<div className="mt-2 pl-4 overflow-hidden transition-all duration-300 max-h-0 group-open:max-h-[2600px]">
							<div className="markdown">
								<Markdown rehypePlugins={[rehypeRaw]}>
									{section.content}
								</Markdown>
							</div>
						</div>
					</details>
				</div>
			))}
		</>
	);
};
