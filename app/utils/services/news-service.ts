import { createClient } from "@supabase/supabase-js";
import { WikiPageType } from "@/app/types";

const API_BASE_URL = "https://api.noboobs.world";
const TELEGRAM_SLUG_PREFIX = "telegram-";

type TelegramMessageResponse = {
	message?: string;
	date?: string;
	image?: string;
};

type TelegramNewsSyncResult =
	| { status: "created"; urlName: string }
	| {
			status: "skipped";
			reason:
				| "empty-message"
				| "same-content"
				| "insert-error"
				| "missing-service-role-key";
	  };

const ONE_HOUR_MS = 60 * 60 * 1000;
let lastHourlySyncAt = 0;

function normalizeTelegramMessage(message?: string): string {
	return (message || "").trim();
}

function normalizeTelegramDate(dateString?: string): Date {
	if (!dateString) return new Date();
	const normalized = dateString.replace(" ", "T");
	const parsed = new Date(normalized);
	if (Number.isNaN(parsed.getTime())) return new Date();
	return parsed;
}

function formatDateForTitle(date: Date): string {
	return date.toLocaleString("uk-UA", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

function formatDateForSlug(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	const seconds = String(date.getSeconds()).padStart(2, "0");
	return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

function formatNewsContent(payload: TelegramMessageResponse): string {
	const message = normalizeTelegramMessage(payload.message);
	const image = payload.image?.trim();

	if (!image) {
		return message;
	}

	return `${message}\n\n![Telegram image](${image})`;
}

function formatSupabaseError(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (typeof error === "object" && error !== null) {
		const message = "message" in error ? String(error.message) : "";
		const details = "details" in error ? String(error.details) : "";
		const hint = "hint" in error ? String(error.hint) : "";
		const code = "code" in error ? String(error.code) : "";
		return (
			[message, details, hint, code].filter(Boolean).join(" | ") ||
			JSON.stringify(error)
		);
	}
	return String(error);
}

function getTelegramSyncClient() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !serviceRoleKey) {
		return null;
	}

	return createClient(supabaseUrl, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}

async function fetchTelegramMessage(): Promise<TelegramMessageResponse | null> {
	try {
		const response = await fetch(`${API_BASE_URL}/get_message`, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; Next.js Server)",
			},
			signal: AbortSignal.timeout(10000),
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(
				`Failed to fetch Telegram message: ${response.status} ${response.statusText}`,
			);
		}

		const data = (await response.json()) as TelegramMessageResponse;
		return data;
	} catch (error) {
		console.error("Error fetching Telegram message:", error);
		return null;
	}
}

export async function syncTelegramNews(): Promise<TelegramNewsSyncResult> {
	const payload = await fetchTelegramMessage();
	const nextMessage = normalizeTelegramMessage(payload?.message);

	if (!payload || !nextMessage) {
		return { status: "skipped", reason: "empty-message" };
	}

	const supabase = getTelegramSyncClient();
	if (!supabase) {
		return { status: "skipped", reason: "missing-service-role-key" };
	}

	const { data: latestTelegramNews, error: latestNewsError } = await supabase
		.from("wiki_pages")
		.select("content")
		.eq("type", WikiPageType.HISTORY)
		.like("url_name", `${TELEGRAM_SLUG_PREFIX}%`)
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (latestNewsError) {
		console.error(
			"Error loading latest Telegram news:",
			formatSupabaseError(latestNewsError),
		);
	}

	const nextContent = formatNewsContent(payload);

	if (latestTelegramNews?.content?.trim() === nextContent.trim()) {
		return { status: "skipped", reason: "same-content" };
	}

	const postDate = normalizeTelegramDate(payload.date);
	const urlName = `telegram-${formatDateForSlug(postDate)}`;

	const { error: insertError } = await supabase.from("wiki_pages").insert({
		title: `Оголошення з Telegram (${formatDateForTitle(postDate)})`,
		content: nextContent,
		url_name: urlName,
		type: WikiPageType.HISTORY,
	});

	if (insertError) {
		console.error(
			"Error inserting Telegram news:",
			formatSupabaseError(insertError),
		);
		return { status: "skipped", reason: "insert-error" };
	}

	return { status: "created", urlName };
}

export async function syncTelegramNewsHourly() {
	const now = Date.now();
	if (now - lastHourlySyncAt < ONE_HOUR_MS) {
		return;
	}

	lastHourlySyncAt = now;
	await syncTelegramNews();
}
