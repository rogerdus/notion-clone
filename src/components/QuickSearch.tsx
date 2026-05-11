"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Page } from "@/lib/types";

export default function QuickSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState<Page[]>([]);
  const [results, setResults] = useState<Page[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      fetch("/api/pages")
        .then((r) => r.json())
        .then(setPages);
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const q = query.toLowerCase();
    const filtered = pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.icon && p.icon.includes(q))
    );
    setResults(filtered);
    setSelectedIdx(0);
  }, [query, pages]);

  const navigate = useCallback(
    (pageId: string) => {
      setOpen(false);
      router.push(`/dashboard/pages/${pageId}`);
    },
    [router]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl animate-fade-in-up rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <svg className="h-5 w-5 text-[var(--text-dim)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages..."
            className="flex-1 bg-transparent text-[var(--text-primary)] outline-none text-base placeholder-[var(--text-dim)]"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIdx((i) => Math.max(i - 1, 0));
              }
              if (e.key === "Enter" && results[selectedIdx]) {
                navigate(results[selectedIdx].id);
              }
            }}
          />
          <kbd className="text-xs text-[var(--text-dim)] border border-[var(--border)] rounded-md px-1.5 py-0.5">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="text-center py-8 text-[var(--text-dim)] text-sm">
              {query ? "No pages found" : "No pages yet"}
            </p>
          )}
          {results.map((page, i) => (
            <button
              key={page.id}
              onClick={() => navigate(page.id)}
              onMouseEnter={() => setSelectedIdx(i)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                i === selectedIdx
                  ? "bg-[var(--bg-hover)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <span className="text-xl">{page.icon || "📄"}</span>
              <span className="flex-1 truncate">{page.title || "Untitled"}</span>
              {page.isFavorite && (
                <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
