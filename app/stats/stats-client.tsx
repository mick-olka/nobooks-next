"use client";

import { useEffect, useState } from "react";
import type { StatsData } from "../types";
import { HallOfFame } from "./hall-of-fame";
import { fetchStatsData } from "@/app/utils/services/stats-service";

export function StatsClient({ initialData }: { initialData: StatsData }) {
  const [statsData, setStatsData] = useState<StatsData>(initialData);

  useEffect(() => {
    // Function to refresh the data
    async function refreshData() {
      try {
        const freshData = await fetchStatsData();
        setStatsData(freshData);
      } catch (error) {
        console.error("Error refreshing stats data:", error);
      }
    }

    // Set up interval to refresh data every minute
    const intervalId = setInterval(refreshData, 60000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <h1 className="text-4xl font-bold my-8 text-center">🎖️ Стіна слави 🎖️</h1>
      <HallOfFame data={statsData} />
    </>
  );
}
