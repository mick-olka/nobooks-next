import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
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
	return NextResponse.json({ ok: true, result });
}
