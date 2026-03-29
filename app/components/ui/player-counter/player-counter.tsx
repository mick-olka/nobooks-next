"use client";

import { useEffect, useState } from "react";

interface PlayerCounterProps {
	format?: string;
	refreshRate?: number;
}

export const PlayerCounter: React.FC<PlayerCounterProps> = ({
	format,
	refreshRate = 60000,
}) => {
	const [onlineCount, setOnlineCount] = useState<number | null>(null);
	const [isOffline, setIsOffline] = useState(false);

	useEffect(() => {
		let isMounted = true;

		const loadOnlineUsers = async () => {
			try {
				const response = await fetch("/api/online", {
					cache: "no-store",
				});

				if (!response.ok) {
					throw new Error("Failed to fetch online users");
				}

				const data = (await response.json()) as unknown;
				const players = Array.isArray(data) ? data : [];

				if (isMounted) {
					setOnlineCount(players.length);
					setIsOffline(false);
				}
			} catch (error) {
				console.error("Error fetching online users:", error);
				if (isMounted) {
					setIsOffline(true);
				}
			}
		};

		loadOnlineUsers();
		const intervalId = window.setInterval(loadOnlineUsers, refreshRate);

		return () => {
			isMounted = false;
			clearInterval(intervalId);
		};
	}, [refreshRate]);

	if (isOffline) {
		return <div>offline</div>;
	}

	const template = format || "{online}";
	return <div>{template.replace("{online}", String(onlineCount ?? 0))}</div>;
};
