import { NextResponse } from "next/server";

const ONLINE_URL = "https://api.noboobs.world/online";

export async function GET() {
	try {
		const response = await fetch(ONLINE_URL, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; Next.js Server)",
			},
			signal: AbortSignal.timeout(10000),
			cache: "no-store",
		});

		if (!response.ok) {
			return NextResponse.json([]);
		}

		const data = (await response.json()) as unknown;
		const players = Array.isArray(data) ? data : [];
		return NextResponse.json(players, { status: 200 });
	} catch (error) {
		console.error("Error fetching online players:", error);
		return NextResponse.json([], { status: 200 });
	}
}
