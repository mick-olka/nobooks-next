"use client";

import { useEffect, useState } from "react";
import type { StatsData } from "@/app/types";
import { cn } from "@/app/utils/cn";

type PlayerEntry = { player: string; value: string; rawValue: number };

// Medal colouring for the top three; everyone else is neutral body text.
function rankClass(index: number): string {
	if (index === 0) return "font-semibold text-amber-300";
	if (index === 1) return "text-slate-300";
	if (index === 2) return "text-amber-600";
	return "text-base-content/80";
}

// Online status indicator dot
const OnlineIndicator = ({ isOnline }: { isOnline: boolean }) => (
	<span
		className={cn(
			"inline-block h-2.5 w-2.5 shrink-0 rounded-full",
			isOnline ? "bg-success ring-2 ring-success/30" : "bg-base-content/25",
		)}
		title={isOnline ? "Онлайн" : "Офлайн"}
		role="img"
		aria-label={isOnline ? "Онлайн" : "Офлайн"}
	/>
);

// A single ranked player row, shared by the cards and the modal list.
const PlayerRow = ({
	index,
	entry,
	isOnline,
}: {
	index: number;
	entry: PlayerEntry;
	isOnline: boolean;
}) => (
	<li
		className={cn(
			"flex items-center gap-3 border-b border-base-content/5 py-2 last:border-0",
			rankClass(index),
		)}
	>
		<span className="w-7 shrink-0 text-sm tabular-nums opacity-70">
			#{index + 1}
		</span>
		<span className="flex min-w-0 flex-1 items-center gap-2">
			<OnlineIndicator isOnline={isOnline} />
			<span className="truncate">{entry.player}</span>
		</span>
		<span className="shrink-0 tabular-nums">{entry.value}</span>
	</li>
);

// Modal listing every player for a single stat
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
	allPlayers: PlayerEntry[];
	onlineStatus: Record<string, boolean>;
}) => {
	// Close on Escape (a declarative `open` <dialog> doesn't do this natively).
	useEffect(() => {
		if (!isOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<dialog className="modal modal-open modal-bottom sm:modal-middle" open>
			<div className="modal-box max-w-lg border border-base-content/10">
				<div className="mb-4 flex items-center justify-between gap-4">
					<h3 className="text-2xl font-bold tracking-tight">{statName}</h3>
					<button
						type="button"
						className="btn btn-circle btn-ghost btn-sm"
						onClick={onClose}
						aria-label="Закрити"
					>
						✕
					</button>
				</div>
				<ol className="max-h-[60vh] overflow-y-auto pr-1">
					{allPlayers.map((entry, index) => (
						<PlayerRow
							key={`${statName}-${entry.player}-${index}`}
							index={index}
							entry={entry}
							isOnline={onlineStatus[entry.player] === true}
						/>
					))}
				</ol>
			</div>
			<button
				type="button"
				className="modal-backdrop"
				onClick={onClose}
				aria-label="Закрити"
			>
				закрити
			</button>
		</dialog>
	);
};

export const HallOfFame = ({ data }: { data: StatsData }) => {
	const [modalState, setModalState] = useState<{
		isOpen: boolean;
		statName: string;
		allPlayers: PlayerEntry[];
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
		return Number.parseInt(value.replace(/,/g, ""), 10) || 0;
	};

	// Get all players for a specific stat
	const getAllPlayersForStat = (statName: string): PlayerEntry[] => {
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
		const records: Record<string, PlayerEntry[]> = {};

		if (!data?.scoreboard?.scores) return records;

		Object.entries(data.scoreboard.scores).forEach(([statName]) => {
			const allPlayers = getAllPlayersForStat(statName);

			if (allPlayers.length === 0) return;

			// Take top 3 (or fewer if there aren't 3 players)
			records[statName] = allPlayers.slice(0, 3);
		});

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
		<div className="text-[1.05rem]">
			<div className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-5">
				{Object.entries(records).map(([statName, topPlayers]) => {
					const allPlayers = getAllPlayersForStat(statName);
					const hasMorePlayers = allPlayers.length > topPlayers.length;

					return (
						<div
							key={statName}
							className="card border border-base-content/5 bg-base-100 shadow-sm transition-colors hover:border-base-content/15"
						>
							<div className="card-body gap-3 p-5">
								<h3 className="line-clamp-2 min-h-16 border-b border-base-content/10 pb-2 text-lg font-semibold leading-snug tracking-tight">
									{statName}
								</h3>
								<ol className="flex flex-col">
									{topPlayers.map((entry, index) => (
										<PlayerRow
											key={`${statName}-${entry.player}`}
											index={index}
											entry={entry}
											isOnline={data.online?.[entry.player] === true}
										/>
									))}
								</ol>
								{hasMorePlayers && (
									<button
										type="button"
										className="btn btn-ghost btn-sm mt-auto w-full font-normal text-base-content/60 hover:text-base-content"
										onClick={() => handleShowAll(statName)}
									>
										Показати всіх ({allPlayers.length})
									</button>
								)}
							</div>
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
