import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { WIKI_TAG } from "@/app/lib/data/wiki-cache";
import { syncTelegramNews } from "@/app/utils/services";

function isAuthorized(request: NextRequest): boolean {
	const secret = process.env.CRON_SECRET;
	if (!secret) return false; // fail closed: no secret configured = deny
	return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
	if (!isAuthorized(request)) {
		return NextResponse.json(
			{ ok: false, error: "Unauthorized" },
			{ status: 401 },
		);
	}

	const result = await syncTelegramNews();
	if (result.status === "created") {
		revalidateTag(WIKI_TAG, { expire: 0 });
	}
	return NextResponse.json({ ok: true, result });
}
