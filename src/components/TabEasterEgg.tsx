"use client";

import { useEffect, useRef } from "react";

export default function TabEasterEgg() {
  const countRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        countRef.current++;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => { countRef.current = 0; }, 3000);
        if (countRef.current >= 10) {
          countRef.current = 0;
          window.location.href = "https://pornhub.com/view_video.php?viewkey=ph5";
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return null;
}
