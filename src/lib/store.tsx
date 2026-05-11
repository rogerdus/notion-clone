"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export interface User { id: string; name: string; email: string; }
export interface Page {
  id: string; title: string; icon: string; userId: string;
  parentId: string | null; groupId: string | null;
  isFavorite: boolean; createdAt: string; updatedAt: string; order: number;
}
export interface PageGroup {
  id: string; name: string; icon: string; userId: string;
  order: number; createdAt: string; updatedAt: string;
}
export interface Block {
  id: string; type: string; content: string; properties: string;
  pageId: string; parentId: string | null; order: number;
  createdAt: string; updatedAt: string;
}

const KEY = "notionhub";

interface StoreData {
  user: User | null;
  pages: Page[];
  groups: PageGroup[];
  blocks: Record<string, Block[]>;
}

function load(): StoreData {
  if (typeof window === "undefined") return { user: null, pages: [], groups: [], blocks: {} };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { user: null, pages: [], groups: [], blocks: {} };
  } catch {
    return { user: null, pages: [], groups: [], blocks: {} };
  }
}

function save(data: StoreData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

function uid() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

type Listener = (data: StoreData) => void;
const listeners = new Set<Listener>();

function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function notify(data: StoreData) {
  for (const fn of listeners) fn(data);
}

interface StoreCtx {
  user: User | null;
  pages: Page[];
  groups: PageGroup[];
  blocks: Record<string, Block[]>;
  login: () => User;
  logout: () => void;
  createPage: (opts?: { title?: string; icon?: string; groupId?: string }) => Page;
  updatePage: (id: string, data: Partial<Page>) => void;
  deletePage: (id: string) => void;
  createGroup: () => PageGroup;
  updateGroup: (id: string, data: Partial<PageGroup>) => void;
  deleteGroup: (id: string) => void;
  getBlocks: (pageId: string) => Block[];
  createBlock: (opts: { type?: string; content?: string; pageId: string; order: number; parentId?: string | null }) => Block;
  updateBlock: (id: string, data: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  reorderBlocks: (changes: { id: string; order: number }[]) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoreData>(load);

  useEffect(() => {
    const unsub = subscribe((d) => setData({ ...d }));
    return unsub;
  }, []);

  const commit = useCallback((d: StoreData) => {
    save(d);
    setData({ ...d });
    notify(d);
  }, []);

  const login = useCallback(() => {
    const user: User = { id: uid(), name: "Demo User", email: "demo@example.com" };
    commit({ ...load(), user });
    return user;
  }, [commit]);

  const logout = useCallback(() => {
    commit({ ...load(), user: null });
  }, [commit]);

  const createPage = useCallback((opts?: { title?: string; icon?: string; groupId?: string }) => {
    const d = load();
    const maxOrder = d.pages.reduce((m, p) => Math.max(m, p.order), -1);
    const page: Page = {
      id: uid(), title: opts?.title || "Untitled", icon: opts?.icon || "📄",
      userId: d.user?.id || "", parentId: null, groupId: opts?.groupId || null,
      isFavorite: false, createdAt: now(), updatedAt: now(), order: maxOrder + 1,
    };
    d.pages.push(page);
    d.blocks[page.id] = [];
    commit(d);
    return page;
  }, [commit]);

  const updatePage = useCallback((id: string, upd: Partial<Page>) => {
    const d = load();
    const idx = d.pages.findIndex((p) => p.id === id);
    if (idx >= 0) {
      d.pages[idx] = { ...d.pages[idx], ...upd, updatedAt: now() };
      commit(d);
    }
  }, [commit]);

  const deletePage = useCallback((id: string) => {
    const d = load();
    d.pages = d.pages.filter((p) => p.id !== id);
    delete d.blocks[id];
    commit(d);
  }, [commit]);

  const createGroup = useCallback(() => {
    const d = load();
    const maxOrder = d.groups.reduce((m, g) => Math.max(m, g.order), -1);
    const group: PageGroup = {
      id: uid(), name: "New Group", icon: "📁",
      userId: d.user?.id || "", order: maxOrder + 1,
      createdAt: now(), updatedAt: now(),
    };
    d.groups.push(group);
    commit(d);
    return group;
  }, [commit]);

  const updateGroup = useCallback((id: string, upd: Partial<PageGroup>) => {
    const d = load();
    const idx = d.groups.findIndex((g) => g.id === id);
    if (idx >= 0) {
      d.groups[idx] = { ...d.groups[idx], ...upd, updatedAt: now() };
      commit(d);
    }
  }, [commit]);

  const deleteGroup = useCallback((id: string) => {
    const d = load();
    d.groups = d.groups.filter((g) => g.id !== id);
    d.pages = d.pages.map((p) => p.groupId === id ? { ...p, groupId: null } : p);
    commit(d);
  }, [commit]);

  const getBlocks = useCallback((pageId: string) => {
    return data.blocks[pageId] || [];
  }, [data.blocks]);

  const createBlock = useCallback((opts: { type?: string; content?: string; pageId: string; order: number; parentId?: string | null }) => {
    const d = load();
    const block: Block = {
      id: uid(), type: opts.type || "text", content: opts.content || "",
      properties: "{}", pageId: opts.pageId, parentId: opts.parentId || null,
      order: opts.order, createdAt: now(), updatedAt: now(),
    };
    if (!d.blocks[opts.pageId]) d.blocks[opts.pageId] = [];
    d.blocks[opts.pageId].push(block);
    commit(d);
    return block;
  }, [commit]);

  const updateBlock = useCallback((id: string, upd: Partial<Block>) => {
    const d = load();
    for (const key of Object.keys(d.blocks)) {
      const arr = d.blocks[key];
      const idx = arr.findIndex((b) => b.id === id);
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], ...upd, updatedAt: now() };
        commit(d);
        return;
      }
    }
  }, [commit]);

  const deleteBlock = useCallback((id: string) => {
    const d = load();
    for (const key of Object.keys(d.blocks)) {
      const arr = d.blocks[key];
      const children = arr.filter((b) => b.parentId === id);
      d.blocks[key] = arr.filter((b) => b.id !== id && b.parentId !== id);
      if (arr.length !== d.blocks[key].length) {
        commit(d);
        return;
      }
    }
  }, [commit]);

  const reorderBlocks = useCallback((changes: { id: string; order: number }[]) => {
    const d = load();
    for (const ch of changes) {
      for (const key of Object.keys(d.blocks)) {
        const b = d.blocks[key].find((x) => x.id === ch.id);
        if (b) { b.order = ch.order; break; }
      }
    }
    commit(d);
  }, [commit]);

  return (
    <Ctx.Provider value={{
      user: data.user, pages: data.pages, groups: data.groups, blocks: data.blocks,
      login, logout, createPage, updatePage, deletePage,
      createGroup, updateGroup, deleteGroup,
      getBlocks, createBlock, updateBlock, deleteBlock, reorderBlocks,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
