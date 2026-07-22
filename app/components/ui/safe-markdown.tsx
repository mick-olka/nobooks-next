import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// Allow images (incl. data/remote src) on top of the safe default schema.
const schema = {
	...defaultSchema,
	attributes: {
		...defaultSchema.attributes,
		img: [...(defaultSchema.attributes?.img ?? []), "src", "alt", "title"],
	},
};

export function SafeMarkdown({ children }: { children: string }) {
	return (
		<Markdown rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}>
			{children}
		</Markdown>
	);
}
