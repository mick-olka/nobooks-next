import type { StatsData } from "@/app/types";
import { useState } from "react";
import "./stats.scss";

// Online status indicator component
const OnlineIndicator = ({
	isOnline,
}: {
	isOnline: boolean;
}) => (
	<span
		className={`online-indicator ${isOnline ? "online" : "offline"}`}
		title={isOnline ? "Онлайн" : "Офлайн"}
		aria-label={isOnline ? "Онлайн" : "Офлайн"}
	/>
);

// Modal component for showing all players
const PlayerModal = ({
	isOpen,
	onClose,
	statName,
	allPlayers,
	onlineStatus,
}: {
	isOpen: boolean;
	onClose: () => void;
	statName: string;
	allPlayers: Array<{ player: string; value: string; rawValue: number }>;
	onlineStatus: Record<string, boolean>;
}) => {
	if (!isOpen) return null;

	return (
		<dialog
			className="modal-overlay"
			onClick={onClose}
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			open
		>
			<div
				className="modal-content"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
			>
				<div className="modal-header">
					<h3>{statName}</h3>
					<button
						type="button"
						className="modal-close"
						onClick={onClose}
						aria-label="Close modal"
					>
						×
					</button>
				</div>
				<div className="modal-body">
					<ul className="all-players-list">
						{allPlayers.map((entry, index) => (
							<li
								key={`${statName}-${entry.player}-${index}`}
								className={`rank-${index + 1}`}
							>
								<span className="position">#{index + 1}</span>
								<span className="player-name">
									<OnlineIndicator
										isOnline={onlineStatus[entry.player] === true}
									/>
									{entry.player}
								</span>
								<span className="score">{entry.value}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</dialog>
	);
};

export const HallOfFame = ({ data }: { data: StatsData }) => {
	const [modalState, setModalState] = useState<{
		isOpen: boolean;
		statName: string;
		allPlayers: Array<{ player: string; value: string; rawValue: number }>;
	}>({
		isOpen: false,
		statName: "",
		allPlayers: [],
	});

	// Skip statistics with error messages
	const isValidStat = (value: string): boolean => {
		return (
			!value.includes("Unknown statistic") &&
			!value.includes("require an argument") &&
			!value.includes("check https://")
		);
	};

	// Helper function to parse values for comparison
	const parseValue = (value: string): number => {
		// Handle time format like "6d 7h 46m 45s"
		// if (
		//   value.includes("д ") ||
		//   value.includes("г ") ||
		//   value.includes("хв ") ||
		//   value.includes("с")
		// ) {
		//   let totalSeconds = 0;

		//   const days = value.match(/(\d+)д/);
		//   if (days) totalSeconds += Number.parseInt(days[1]) * 86400;

		//   const hours = value.match(/(\d+)г/);
		//   if (hours) totalSeconds += Number.parseInt(hours[1]) * 3600;

		//   const minutes = value.match(/(\d+)хв/);
		//   if (minutes) totalSeconds += Number.parseInt(minutes[1]) * 60;

		//   const seconds = value.match(/(\d+)с/);
		//   if (seconds) totalSeconds += Number.parseInt(seconds[1]);

		//   return totalSeconds;
		// }

		// Default: parse as number
		return Number.parseInt(value.replace(/,/g, ""), 10) || 0;
	};

	// Get all players for a specific stat
	const getAllPlayersForStat = (statName: string) => {
		if (!data?.scoreboard?.scores?.[statName]) return [];

		const allScores = Object.entries(data.scoreboard.scores[statName])
			.filter(([_, value]) => isValidStat(value))
			.map(([player, value]) => ({
				player,
				value,
				rawValue: parseValue(value),
			}));

		// Sort players by their scores (highest first)
		if (statName === "Найменше смертей")
			return allScores.sort((a, b) => a.rawValue - b.rawValue);
		return allScores.sort((a, b) => b.rawValue - a.rawValue);
	};

	// Get top performers for each stat
	const getTopPerformers = () => {
		const records: Record<
			string,
			Array<{ player: string; value: string; rawValue: number }>
		> = {};

		if (!data?.scoreboard?.scores) return records;

		// biome-ignore lint/complexity/noForEach: <fix later>
		Object.entries(data.scoreboard.scores).forEach(
			([statName, playerScores]) => {
				const allPlayers = getAllPlayersForStat(statName);

				if (allPlayers.length === 0) return;

				// Take top 3 (or fewer if there aren't 3 players)
				records[statName] = allPlayers.slice(0, 3);
			},
		);

		return records;
	};

	const records = getTopPerformers();

	const handleShowAll = (statName: string) => {
		const allPlayers = getAllPlayersForStat(statName);
		setModalState({
			isOpen: true,
			statName,
			allPlayers,
		});
	};

	const handleCloseModal = () => {
		setModalState({
			isOpen: false,
			statName: "",
			allPlayers: [],
		});
	};

	return (
		<div className="hall-of-fame">
			<div className="records-container">
				{Object.entries(records).map(([statName, topPlayers]) => {
					const allPlayers = getAllPlayersForStat(statName);
					const hasMorePlayers = allPlayers.length > topPlayers.length;

					return (
						<div key={statName} className="stat-card">
							<h3>{statName}</h3>
							<ul className="top-players">
								{topPlayers.map((entry, index) => (
									<li
										key={`${statName}-${entry.player}`}
										className={`rank-${index + 1}`}
									>
										<span className="position">#{index + 1}</span>
										<span className="player-name">
											<OnlineIndicator
												isOnline={data.online?.[entry.player] === true}
											/>
											{entry.player}
										</span>
										<span className="score">{entry.value}</span>
									</li>
								))}
							</ul>
							{hasMorePlayers && (
								<button
									type="button"
									className="show-all-btn"
									onClick={() => handleShowAll(statName)}
								>
									Показати всіх ({allPlayers.length})
								</button>
							)}
						</div>
					);
				})}
			</div>

			<PlayerModal
				isOpen={modalState.isOpen}
				onClose={handleCloseModal}
				statName={modalState.statName}
				allPlayers={modalState.allPlayers}
				onlineStatus={data.online || {}}
			/>
		</div>
	);
};
