import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WikiGrid } from "@/app/components/wiki/wiki-grid";
import {
	type UserAccount,
	UserRole,
	type WikiPage,
	WikiPageType,
} from "@/app/types";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn() }),
	unstable_rethrow: (error: unknown) => {
		throw error;
	},
}));

// createWikiPageAction's import chain pulls in "server-only"-guarded modules
// (wiki-cache -> "server-only") that can't be resolved under jsdom/Vite; it's
// never invoked in these tests (the create button is never clicked), so a
// stub is sufficient.
vi.mock("@/app/actions/wiki", () => ({
	createWikiPageAction: vi.fn(),
}));

const pages: WikiPage[] = [
	{
		id: "1",
		title: "Alpha",
		url_name: "alpha",
		content: "",
		type: WikiPageType.REGION,
		created_at: "",
		updated_at: "",
		created_by: "",
		last_modified_by: "",
	},
];

const user = (role: UserRole): UserAccount =>
	({ id: "u1", user_role: role }) as UserAccount;

describe("WikiGrid", () => {
	it("renders a card per page linking to /wiki/[url_name]", () => {
		render(<WikiGrid data={pages} user={null} type={WikiPageType.REGION} />);
		expect(screen.getByText("Alpha")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Alpha/ })).toHaveAttribute(
			"href",
			"/wiki/alpha",
		);
	});

	it("shows the create button for admin and moderator", () => {
		for (const role of [UserRole.ADMIN, UserRole.MODERATOR]) {
			const { unmount } = render(
				<WikiGrid data={[]} user={user(role)} type={WikiPageType.REGION} />,
			);
			expect(screen.getByRole("button")).toBeInTheDocument();
			unmount();
		}
	});

	it("hides the create button for a regular user and for anonymous", () => {
		for (const u of [user(UserRole.USER), null]) {
			const { unmount } = render(
				<WikiGrid data={[]} user={u} type={WikiPageType.REGION} />,
			);
			expect(screen.queryByRole("button")).not.toBeInTheDocument();
			unmount();
		}
	});
});
