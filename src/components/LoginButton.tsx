"use client";

import { useRef, useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginButton() {
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleClick = async () => {
    setLoading(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      await new Promise((resolve) => {
        audioRef.current!.onended = resolve;
      });
    }
    await signIn("credentials", { redirectTo: "/dashboard" });
  };

  return (
    <>
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/login.mp3" type="audio/mpeg" />
      </audio>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="group relative w-full overflow-hidden rounded-lg bg-[#ff9900] px-4 py-3 text-sm font-bold text-black shadow-lg transition-all duration-300 hover:bg-[#ff8000] active:scale-[0.98] disabled:opacity-70"
      >
        <span className="relative flex items-center justify-center gap-2">
          {loading ? (
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
          {loading ? "Entrando..." : "Acceder"}
        </span>
      </button>
    </>
  );
}
