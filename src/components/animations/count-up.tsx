"use client";

import { useEffect, useState } from "react";

export function CountUp({ value, duration = 600, format }: { value: number; duration?: number; format?: (n: number) => string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const from = display;
    const diff = value - from;
    let raf: number;
    const tick = (t: number) => {
      const progress = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + diff * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format ? format(display) : Math.round(display).toLocaleString("id-ID")}</>;
}
