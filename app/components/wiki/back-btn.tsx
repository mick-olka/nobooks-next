"use client";

import { useRouter } from "next/navigation";

export const BackBtn = () => {
  const router = useRouter();

  const handleClick = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <button
      type="button"
      className="btn btn-link text-2xl"
      onClick={handleClick}
    >
      {"< Назад"}
    </button>
  );
};
