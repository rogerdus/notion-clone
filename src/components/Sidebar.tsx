"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import type { Page, PageGroup } from "@/lib/types";

const pageEmojis = [
  "📄", "📝", "✏️", "📌", "📎", "🎯", "💡", "⭐",
  "🔥", "✅", "❌", "⚠️", "🚀", "💻", "📱", "🌐",
  "🎨", "🎵", "📷", "🎬", "📊", "📈", "📉", "🗂️",
  "📁", "📂", "🔧", "⚙️", "🔒", "🔓", "💾", "🖥️",
  "🧠", "🎉", "💪", "🏆", "📚", "🎓", "💼", "🏠",
  "❤️", "💬", "👤", "👥", "🌍", "☀️", "🌙", "🌈",
];

interface SidebarProps {
  pages: Page[];
  groups: PageGroup[];
}

export default function Sidebar({ pages, groups }: SidebarProps) {
  const router = useRouter();
  const params = useParams();
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [moveMenuPageId, setMoveMenuPageId] = useState<string | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageTitle, setEditingPageTitle] = useState("");
  const [iconPickerPageId, setIconPickerPageId] = useState<string | null>(null);
  const currentPageId = params?.pageId as string;
  const { theme, toggle } = useTheme();
  const moveMenuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const pageEditInputRef = useRef<HTMLInputElement>(null);
  const iconPickerRef = useRef<HTMLDivElement>(null);

  const favorites = pages.filter((p) => p.isFavorite);
  const groupedMap = new Map<string | null, Page[]>();
  for (const p of pages) {
    const key = p.isFavorite ? "__fav__" : (p.groupId || "__ungrouped__");
    if (!groupedMap.has(key)) groupedMap.set(key, []);
    groupedMap.get(key)!.push(p);
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target as Node)) {
        setMoveMenuPageId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingGroupId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingGroupId]);

  useEffect(() => {
    if (editingPageId && pageEditInputRef.current) {
      pageEditInputRef.current.focus();
      pageEditInputRef.current.select();
    }
  }, [editingPageId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(e.target as Node)) {
        setIconPickerPageId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreatePage = async (groupId?: string) => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled", groupId }),
      });
      const page = await res.json();
      router.push(`/dashboard/pages/${page.id}`);
      router.refresh();
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    if (!confirm("Delete this page?")) return;
    await fetch(`/api/pages/${pageId}`, { method: "DELETE" });
    if (currentPageId === pageId) router.push("/dashboard");
    router.refresh();
  };

  const toggleFavorite = async (e: React.MouseEvent, pageId: string, current: boolean) => {
    e.stopPropagation();
    await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !current }),
    });
    router.refresh();
  };

  const handleCreateGroup = async () => {
    setIsCreatingGroup(true);
    try {
      await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      router.refresh();
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    if (!confirm("Delete this group? Pages will be ungrouped.")) return;
    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    router.refresh();
  };

  const handleRenameGroup = async (groupId: string) => {
    if (editingName.trim()) {
      await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      router.refresh();
    }
    setEditingGroupId(null);
  };

  const handleRenamePage = async (pageId: string) => {
    if (editingPageTitle.trim()) {
      await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingPageTitle.trim() }),
      });
      router.refresh();
    }
    setEditingPageId(null);
  };

  const handleChangeIcon = async (pageId: string, icon: string) => {
    await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icon }),
    });
    setIconPickerPageId(null);
    router.refresh();
  };

  const handleMovePageToGroup = async (pageId: string, groupId: string | null) => {
    await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });
    setMoveMenuPageId(null);
    router.refresh();
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const renderPageItem = (page: Page, showMoveButton = true) => (
    <div
      key={page.id}
      onClick={() => router.push(`/dashboard/pages/${page.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/dashboard/pages/${page.id}`);
      }}
      className={`group flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm transition-all rounded-md ${
        currentPageId === page.id
          ? "bg-[var(--bg-active)] text-[var(--text-primary)]"
          : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
      }`}
    >
      <div className="relative flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setIconPickerPageId(iconPickerPageId === page.id ? null : page.id); }}
          className="text-base hover:opacity-80 transition-opacity"
        >
          {page.icon || "📄"}
        </button>
        {iconPickerPageId === page.id && (
          <div ref={iconPickerRef} className="absolute left-0 top-full mt-1 w-56 p-2 rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] shadow-2xl z-50">
            <div className="grid grid-cols-8 gap-0.5">
              {pageEmojis.map((e) => (
                <button key={e} onClick={() => handleChangeIcon(page.id, e)}
                  className={`text-base p-1 rounded-lg hover:bg-[var(--bg-hover)] transition-colors ${page.icon === e ? "bg-[var(--bg-active)]" : ""}`}
                >
                  {e}
                </button>
              ))}
        </div>

        <button
          onClick={() => handleCreatePage()}
          disabled={isCreating}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New page
        </button>
      </div>
        )}
      </div>
      {editingPageId === page.id ? (
        <input
          ref={pageEditInputRef}
          value={editingPageTitle}
          onChange={(e) => setEditingPageTitle(e.target.value)}
          onBlur={() => handleRenamePage(page.id)}
          onKeyDown={(e) => { if (e.key === "Enter") handleRenamePage(page.id); if (e.key === "Escape") setEditingPageId(null); }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent text-sm text-[var(--text-secondary)] outline-none min-w-0"
        />
      ) : (
        <span
          onDoubleClick={(e) => { e.stopPropagation(); setEditingPageId(page.id); setEditingPageTitle(page.title); }}
          className="flex-1 truncate cursor-pointer hover:bg-[var(--bg-hover)] rounded px-0.5 transition-colors"
        >
          {page.title || "Untitled"}
        </span>
      )}
      {showMoveButton && (
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMoveMenuPageId(moveMenuPageId === page.id ? null : page.id); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--bg-hover)] transition-all"
          >
            <svg className="h-3.5 w-3.5 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          {moveMenuPageId === page.id && (
            <div ref={moveMenuRef} className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-[var(--border)] bg-[var(--bg-sidebar)] shadow-2xl z-50 py-1">
              <div className="px-3 py-1 text-xs text-[var(--text-dim)] uppercase tracking-wider">Move to group</div>
              <button
                onClick={() => handleMovePageToGroup(page.id, null)}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${!page.groupId ? "text-[var(--text-primary)] bg-[var(--bg-active)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"}`}
              >
                Ungrouped
              </button>
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleMovePageToGroup(page.id, g.id)}
                  className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${page.groupId === g.id ? "text-[var(--text-primary)] bg-[var(--bg-active)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"}`}
                >
                  {g.icon} {g.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <button
        onClick={(e) => toggleFavorite(e, page.id, page.isFavorite)}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--bg-hover)] transition-all"
      >
        <svg
          className={`h-4 w-4 ${page.isFavorite ? "text-yellow-500 opacity-100" : "text-[var(--text-dim)]"}`}
          fill={page.isFavorite ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </button>
      <button
        onClick={(e) => handleDelete(e, page.id)}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--bg-hover)] transition-all"
      >
        <svg className="h-3.5 w-3.5 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );

  const groupPages = (g: PageGroup) => (groupedMap.get(g.id) || []).filter((p) => !p.isFavorite);
  const ungroupedPages = (groupedMap.get("__ungrouped__") || []).filter((p) => !p.isFavorite);

  return (
    <aside className="flex h-full w-60 flex-col bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)]">
      <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--border-subtle)]">
        <span className="flex items-center gap-2 text-sm font-bold text-white tracking-tight">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-[var(--accent)] text-black font-black text-xs">
            PH
          </span>
          Notion<span className="text-[var(--accent)]">Hub</span>
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => handleCreatePage()}
            disabled={isCreating}
            className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-all disabled:opacity-50"
            title="New page"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-2">
        {favorites.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">Favorites</span>
            </div>
            {favorites.map((p) => renderPageItem(p, false))}
          </div>
        )}

        <div className="px-3 mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">Groups</span>
          <button
            onClick={handleCreateGroup}
            disabled={isCreatingGroup}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-50 flex items-center gap-0.5"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New group
          </button>
        </div>

        {groups.length > 0 ? (
          <div className="space-y-1">
            {groups.map((g) => {
              const isCollapsed = collapsedGroups.has(g.id);
              const children = groupPages(g);
              return (
                <div key={g.id}>
                  <div
                    className="group flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer hover:bg-[var(--bg-hover)] transition-all"
                    onClick={() => toggleGroupCollapse(g.id)}
                  >
                    <svg
                      className={`h-3 w-3 text-[var(--text-dim)] transition-transform flex-shrink-0 ${isCollapsed ? "" : "rotate-90"}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-base flex-shrink-0">{g.icon}</span>
                    {editingGroupId === g.id ? (
                      <input
                        ref={editInputRef}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleRenameGroup(g.id)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRenameGroup(g.id); if (e.key === "Escape") setEditingGroupId(null); }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-transparent text-sm text-[var(--text-secondary)] outline-none min-w-0"
                      />
                    ) : (
                      <span className="flex-1 text-sm text-[var(--text-secondary)] truncate">{g.name}</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingGroupId(g.id); setEditingName(g.name); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--bg-hover)] transition-all flex-shrink-0"
                    >
                      <svg className="h-3 w-3 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDeleteGroup(e, g.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--bg-hover)] transition-all flex-shrink-0"
                    >
                      <svg className="h-3 w-3 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {!isCollapsed && (
                    <div className="ml-2 space-y-0.5 mt-0.5">
                      {children.length > 0 ? (
                        children.map((p) => renderPageItem(p))
                      ) : (
                        <p className="px-3 py-1 text-xs text-[var(--text-dim)]">This group is empty</p>
                      )}
                      <button
                        onClick={() => handleCreatePage(g.id)}
                        className="flex w-full items-center gap-1 px-3 py-1 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors opacity-0 hover:opacity-100"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New page in this group
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="px-3 text-xs text-[var(--text-dim)]">
            No groups yet. Click &quot;New group&quot; above to organize your pages.
          </p>
        )}

        {ungroupedPages.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">Ungrouped pages</span>
            </div>
            {ungroupedPages.map((p) => renderPageItem(p))}
          </div>
        )}

        {ungroupedPages.length === 0 && groups.length === 0 && favorites.length === 0 && (
          <p className="px-3 text-xs text-[var(--text-dim)]">No pages yet</p>
        )}

        <div className="border-t border-[var(--border-subtle)] pt-2 mt-2">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider flex items-center gap-1">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Top Videos
            </span>
            <span className="text-[10px] text-[var(--text-dim)]">Easter Egg</span>
          </div>
          <div className="space-y-2 px-2">
            {[
              { title: "Roger Deus: La entrevista completa", views: "2.4M", duration: "14:22", badge: "NUEVO" },
              { title: "Secretarias en acción: Jornada intensa", views: "1.8M", duration: "28:15", badge: "🔥" },
              { title: "Documentación filtrada: Lo prohibido", views: "1.2M", duration: "8:47", badge: "TRENDING" },
              { title: "Agentes uniformadas: Operativo especial", views: "892K", duration: "42:08", badge: "⭐" },
              { title: "LAS MEJORES DEPENDENCIAS DE GOBIERNO", views: "3.1M", duration: "52:30", badge: "🔴 LIVE" },
            ].map((video, i) => (
              <div key={i} className="group flex gap-2 rounded-lg p-1.5 hover:bg-[var(--bg-hover)] transition-all cursor-default">
                <div className="relative w-14 h-14 rounded-md bg-gradient-to-br from-[#ff9900]/20 to-[#1a1a1a] flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <span className="text-lg opacity-30">▶</span>
                  <span className="absolute bottom-0.5 right-0.5 text-[9px] bg-black/80 text-white px-0.5 rounded font-mono">
                    {video.duration}
                  </span>
                  <span className="absolute top-0.5 left-0.5 text-[7px] bg-[#ff9900] text-black font-bold px-0.5 rounded">
                    {video.badge}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--text-secondary)] leading-tight truncate">{video.title}</p>
                  <p className="text-[10px] text-[var(--text-dim)] mt-0.5">{video.views} vistas</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-3 pb-1">
          <div className="flex flex-wrap gap-1.5">
            {["Oficios", "Secretarias", "Agentes", "Uniformadas", "Dependencias", "Trámites", "Expedientes", "Inspección"].map((tag) => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-dim)] cursor-default hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-subtle)] p-3 space-y-1">
        <button
          onClick={toggle}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-all"
        >
          {theme === "dark" ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
