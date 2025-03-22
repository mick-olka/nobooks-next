"use client";
import WebStats from "./WebStats-dist";
import "./stats.scss";

import { useEffect } from "react";

export const Stats = () => {
  useEffect(() => {
    new WebStats({
      host: "209.25.141.16:3583", // The IP and port of WebStats on the MC server
      tableParent: document.getElementById("webstats-tables"),
      updateInterval: 10000, // Set to 0 to disable auto-updating (in ms, default 10000)
      showSkins: true, // Whether to show player heads (default true)
      displayCount: 100, // Max rows to show on one page (default 100, set to -1 to disable pagination)
    });
  }, []);
  return (
    <div className="webstats-main">
      <main>
        <span>
          <input
            type="checkbox"
            name="hide-offline"
            id="hide-offline"
            className="webstats-option"
          />
          <label htmlFor="hide-offline">Hide offline players</label>
        </span>
        <span className="webstats-status">
          <span className="webstats-loading-indicator">Loading...</span>
          <span className="webstats-error-message" />
        </span>

        {/* <span className="webstats-pagination">
        <button name="prev" className="webstats-pagination">
        Prev
        </button>
        <select name="page" className="webstats-pagination"></select>
        <button name="next" className="webstats-pagination">
        Next
        </button>
        </span> */}

        <div id="webstats-tables" />
      </main>
    </div>
  );
};
