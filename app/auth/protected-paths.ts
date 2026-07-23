export const PROTECTED_PREFIXES = ["/profile"] as const;

export function isProtectedPath(pathname: string): boolean {
	return PROTECTED_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}
