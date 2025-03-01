"use client";

import { useEffect, useRef } from "react";
import { PlayerCounter as PlayerCounterClass } from "./playercount";

interface PlayerCounterProps {
  ip: string;
  format?: string;
  refreshRate?: number;
}

export const PlayerCounter: React.FC<PlayerCounterProps> = ({
  ip,
  format,
  refreshRate,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<PlayerCounterClass | null>(null);

  useEffect(() => {
    if (elementRef.current) {
      counterRef.current = new PlayerCounterClass({
        ip,
        element: elementRef.current,
        format,
        refreshRate,
      });
    }

    return () => {
      counterRef.current?.destroy();
    };
  }, [ip, format, refreshRate]);

  return <div ref={elementRef} />;
};
