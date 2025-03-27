import type { StatsData } from "@/app/types";
import "./stats.scss";

export const HallOfFame = ({ data }: { data: StatsData }) => {
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
        // Filter out invalid statistics
        const validScores = Object.entries(playerScores)
          .filter(([_, value]) => isValidStat(value))
          .map(([player, value]) => ({
            player,
            value,
            rawValue: parseValue(value),
          }));

        if (validScores.length === 0) return;

        // Sort players by their scores (highest first)
        validScores.sort((a, b) => b.rawValue - a.rawValue);

        // Take top 3 (or fewer if there aren't 3 players)
        records[statName] = validScores.slice(0, 3);
      }
    );

    return records;
  };

  const records = getTopPerformers();

  return (
    <div className="hall-of-fame">
      <div className="records-container">
        {Object.entries(records).map(([statName, topPlayers]) => (
          <div key={statName} className="stat-card">
            <h3>{statName}</h3>
            <ul className="top-players">
              {topPlayers.map((entry, index) => (
                <li
                  key={`${statName}-${entry.player}`}
                  className={`rank-${index + 1}`}
                >
                  <span className="position">#{index + 1}</span>
                  <span className="player-name">{entry.player}</span>
                  <span className="score">{entry.value}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
