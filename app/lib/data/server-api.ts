const API_BASE_URL = "https://api.noboobs.world";

export function serverApiFetch(
	path: string,
	opts: { revalidate?: number } = {},
): Promise<Response> {
	return fetch(`${API_BASE_URL}${path}`, {
		headers: { "User-Agent": "Mozilla/5.0 (compatible; Next.js Server)" },
		signal: AbortSignal.timeout(10000),
		...(opts.revalidate === undefined
			? { cache: "no-store" as const }
			: { next: { revalidate: opts.revalidate } }),
	});
}
