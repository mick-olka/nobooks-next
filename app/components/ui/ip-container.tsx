"use client";

import toast from "react-hot-toast";

export const IpContainer = ({ ip }: { ip: string }) => {
  const handleClick = () => {
    navigator.clipboard.writeText(ip);
    toast("IP скопійовано", { position: "bottom-right" });
  };
  return (
    <button
      className="bg-base-300 px-3 py-1 pt-1 rounded-md cursor-pointer hover:bg-base-100 transition-colors flex"
      onClick={handleClick}
      tabIndex={0}
      type="button"
      title="Натисніть, щоб скопіювати"
    >
      {ip}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-5 ml-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <title>Натисніть, щоб скопіювати</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    </button>
  );
};
