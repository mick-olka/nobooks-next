import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

export function SafeMarkdown({ children }: { children: string }) {
	return (
		<Markdown rehypePlugins={[rehypeRaw, [rehypeSanitize, defaultSchema]]}>
			{children}
		</Markdown>
	);
}
