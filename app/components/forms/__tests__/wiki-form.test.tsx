import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WikiPageForm } from "@/app/components/forms/wiki-form";
import { type WikiPage, WikiPageType } from "@/app/types";

const pageData: WikiPage = {
	id: "1",
	title: "Title",
	content: "Body",
	url_name: "slug",
	type: WikiPageType.WIKI,
	created_at: "",
	updated_at: "",
	created_by: "",
	last_modified_by: "u1",
};

describe("WikiPageForm", () => {
	it("prefills fields from pageData", () => {
		render(<WikiPageForm pageData={pageData} handleSubmitAction={vi.fn()} />);
		expect(screen.getByDisplayValue("Title")).toBeInTheDocument();
		expect(screen.getByDisplayValue("slug")).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("Enter markdown content..."),
		).toHaveValue("Body");
	});

	it("submits the edited values", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<WikiPageForm pageData={pageData} handleSubmitAction={onSubmit} />);

		const title = screen.getByDisplayValue("Title");
		await user.clear(title);
		await user.type(title, "New Title");

		await user.click(screen.getByRole("button", { name: /Зберегти/ }));

		expect(onSubmit).toHaveBeenCalledTimes(1);
		expect(onSubmit).toHaveBeenCalledWith({
			title: "New Title",
			content: "Body",
			id: "1",
			userId: "u1",
			url_name: "slug",
			type: WikiPageType.WIKI,
		});
	});
});
