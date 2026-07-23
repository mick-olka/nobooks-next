import { UserRole } from "@/app/types";

export function parseRole(value: unknown): UserRole {
	if (typeof value === "string") {
		const match = Object.values(UserRole).find((role) => role === value);
		if (match) return match;
	}
	return UserRole.USER;
}

export function canEditContent(role: UserRole): boolean {
	return role === UserRole.ADMIN || role === UserRole.MODERATOR;
}
