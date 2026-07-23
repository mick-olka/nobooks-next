import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SafeMarkdown } from "@/app/components/ui/safe-markdown";

describe("SafeMarkdown", () => {
	it("renders markdown formatting and keeps images", () => {
		const { container } = render(
			<SafeMarkdown>{"# Title\n\n![alt](https://x/y.png)"}</SafeMarkdown>,
		);
		expect(container.querySelector("h1")?.textContent).toBe("Title");
		expect(container.querySelector("img")).not.toBeNull();
	});

	it("strips script tags from raw HTML", () => {
		const { container } = render(
			<SafeMarkdown>{"<p>ok</p><script>window.x=1</script>"}</SafeMarkdown>,
		);
		expect(container.querySelector("script")).toBeNull();
		expect(container.textContent).toContain("ok");
	});
});
