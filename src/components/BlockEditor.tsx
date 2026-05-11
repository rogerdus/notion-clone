"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import type { Block } from "@/lib/types";

interface BlockEditorProps {
  pageId: string;
  initialBlocks: Block[];
  pageTitle: string;
  pageIcon: string;
}

const blockTypes = [
  { value: "text", label: "Text" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "bullet", label: "Bullet list" },
  { value: "numbered", label: "Numbered list" },
  { value: "todo", label: "To-do list" },
  { value: "toggle", label: "Toggle list" },
  { value: "quote", label: "Quote" },
  { value: "callout", label: "Callout" },
  { value: "code", label: "Code" },
  { value: "image", label: "Image" },
  { value: "divider", label: "Divider" },
];

const blockPlaceholders: Record<string, string> = {
  text: "Type / for commands",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  bullet: "List item",
  numbered: "List item",
  todo: "To-do",
  toggle: "Toggle list",
  quote: "Quote",
  callout: "Callout",
  code: "Code",
  image: "Caption...",
};

const calloutColors = [
  { label: "Default", bg: "bg-zinc-800/40", border: "border-zinc-700" },
  { label: "Blue", bg: "bg-blue-900/20", border: "border-blue-800" },
  { label: "Green", bg: "bg-green-900/20", border: "border-green-800" },
  { label: "Orange", bg: "bg-orange-900/20", border: "border-orange-800" },
  { label: "Red", bg: "bg-red-900/20", border: "border-red-800" },
  { label: "Purple", bg: "bg-purple-900/20", border: "border-purple-800" },
];

const emojis = [
  "📄", "📝", "✏️", "📌", "📎", "🎯", "💡", "⭐",
  "🔥", "✅", "❌", "⚠️", "🚀", "💻", "📱", "🌐",
  "🎨", "🎵", "📷", "🎬", "📊", "📈", "📉", "🗂️",
  "📁", "📂", "🔧", "⚙️", "🔒", "🔓", "💾", "🖥️",
  "🧠", "🎉", "💪", "🏆", "📚", "🎓", "💼", "🏠",
  "❤️", "💬", "👤", "👥", "🌍", "☀️", "🌙", "🌈",
];

function computeDepth(blocks: Block[], blockId: string): number {
  let depth = 0;
  let current = blocks.find((b) => b.id === blockId);
  while (current?.parentId) {
    depth++;
    current = blocks.find((b) => b.id === current!.parentId);
  }
  return depth;
}

function getTopLevelBlocks(blocks: Block[]): Block[] {
  const map = new Map<string, Block[]>();
  const tops: Block[] = [];
  for (const b of blocks) {
    if (b.parentId) {
      const arr = map.get(b.parentId) || [];
      arr.push(b);
      map.set(b.parentId, arr);
    } else {
      tops.push(b);
    }
  }
  const flatten = (list: Block[]): Block[] => {
    const result: Block[] = [];
    for (const b of list.sort((a, c) => a.order - c.order)) {
      result.push(b);
      if (map.has(b.id)) result.push(...flatten(map.get(b.id)!));
    }
    return result;
  };
  return flatten(tops);
}

export default function BlockEditor({
  pageId,
  initialBlocks,
  pageTitle,
  pageIcon,
}: BlockEditorProps) {
  const store = useStore();
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [title, setTitle] = useState(pageTitle);
  const [icon, setIcon] = useState(pageIcon);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [showTypeMenu, setShowTypeMenu] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Map<string, HTMLElement | null>>(new Map());
  const titleTimeoutRef = useRef<NodeJS.Timeout>(undefined);
  const blockTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const menuRef = useRef<HTMLDivElement>(null);
  const iconPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const dragSourceRef = useRef<string | null>(null);
  const resizeRef = useRef<{ blockId: string; startX: number; startW: number } | null>(null);

  const orderedBlocks = getTopLevelBlocks(blocks);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowTypeMenu(null);
      if (iconPickerRef.current && !iconPickerRef.current.contains(e.target as Node)) setShowIconPicker(false);
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) setShowColorPicker(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (focusedBlockId) {
      const el = blockRefs.current.get(focusedBlockId);
      if (el) {
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [focusedBlockId]);

  useEffect(() => {
    return () => { blockTimeoutsRef.current.forEach((t) => clearTimeout(t)); };
  }, []);

  const saveTitle = useCallback(
    (newTitle: string) => {
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
      titleTimeoutRef.current = setTimeout(() => {
        store.updatePage(pageId, { title: newTitle });
      }, 500);
    },
    [pageId, store]
  );

  const saveIcon = useCallback((newIcon: string) => {
    store.updatePage(pageId, { icon: newIcon });
  }, [pageId, store]);

  const saveBlock = useCallback(
    (blockId: string, updates: Partial<Block>) => {
      const existing = blockTimeoutsRef.current.get(blockId);
      if (existing) clearTimeout(existing);
      const timeout = setTimeout(() => {
        store.updateBlock(blockId, updates);
      }, 300);
      blockTimeoutsRef.current.set(blockId, timeout);
    },
    [store]
  );

  const addBlock = useCallback(
    (afterOrder: number, parentId: string | null = null) => {
      const block = store.createBlock({ type: "text", content: "", pageId, order: afterOrder + 1, parentId });
      setBlocks((prev) => [...prev, block]);
      setFocusedBlockId(block.id);
    },
    [pageId, store]
  );

  const deleteBlock = useCallback(
    (blockId: string) => {
      setBlocks((prev) => prev.filter((b) => b.id !== blockId && b.parentId !== blockId));
      store.deleteBlock(blockId);
    },
    [store]
  );

  const changeBlockType = useCallback(
    (blockId: string, type: string) => {
      setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, type } : b)));
      setShowTypeMenu(null);
      setFocusedBlockId(blockId);
      store.updateBlock(blockId, { type });
    },
    [store]
  );

  const handleBlockContent = useCallback(
    (blockId: string, content: string) => {
      setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, content } : b)));
      saveBlock(blockId, { content });
    },
    [saveBlock]
  );

  const indentBlock = useCallback(
    (blockId: string) => {
      const idx = blocks.findIndex((b) => b.id === blockId);
      if (idx <= 0) return;
      const block = blocks[idx];
      const prev = blocks[idx - 1];
      if (!prev || prev.parentId === block.id) return;
      const newParentId = block.parentId === prev.id ? prev.parentId : prev.id;
      setBlocks((prevBlocks) =>
        prevBlocks.map((b) => (b.id === blockId ? { ...b, parentId: newParentId } : b))
      );
      store.updateBlock(blockId, { parentId: newParentId });
    },
    [blocks, store]
  );

  const outdentBlock = useCallback(
    (blockId: string) => {
      const block = blocks.find((b) => b.id === blockId);
      if (!block?.parentId) return;
      const parent = blocks.find((b) => b.id === block.parentId);
      const newParentId = parent?.parentId ?? null;
      setBlocks((prevBlocks) =>
        prevBlocks.map((b) => (b.id === blockId ? { ...b, parentId: newParentId } : b))
      );
      store.updateBlock(blockId, { parentId: newParentId });
    },
    [blocks, store]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, block: Block, index: number) => {
      if (e.key === "Escape") {
        setShowTypeMenu(null);
        setShowColorPicker(null);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "b") { e.preventDefault(); document.execCommand("bold"); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === "i") { e.preventDefault(); document.execCommand("italic"); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === "u") { e.preventDefault(); document.execCommand("underline"); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === "e") { e.preventDefault(); document.execCommand("insertText", false, "`"); return; }

      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        indentBlock(block.id);
        return;
      }
      if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        outdentBlock(block.id);
        return;
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const parentId = block.type === "toggle" ? block.id : block.parentId;
        addBlock(block.order, parentId);
        return;
      }

      if (e.key === "Backspace" && block.content === "" && orderedBlocks.length > 1) {
        e.preventDefault();
        const prevBlock = orderedBlocks[index - 1];
        if (prevBlock) setFocusedBlockId(prevBlock.id);
        deleteBlock(block.id);
        return;
      }

      if (e.key === "ArrowUp" && index > 0) {
        e.preventDefault();
        setFocusedBlockId(orderedBlocks[index - 1].id);
        return;
      }

      if (e.key === "ArrowDown" && index < orderedBlocks.length - 1) {
        e.preventDefault();
        setFocusedBlockId(orderedBlocks[index + 1].id);
        return;
      }

      if (e.key === "/" && block.content === "") {
        e.preventDefault();
        setShowTypeMenu(block.id);
      }
    },
    [addBlock, deleteBlock, orderedBlocks, indentBlock, outdentBlock]
  );

  const setBlockRef = useCallback(
    (blockId: string, el: HTMLElement | null) => {
      if (el) {
        const current = blocks.find((b) => b.id === blockId);
        if (current && el.textContent !== current.content) {
          el.textContent = current.content;
        }
        blockRefs.current.set(blockId, el);
      } else {
        blockRefs.current.delete(blockId);
      }
    },
    [blocks]
  );

  const handleDragStart = useCallback((e: React.DragEvent, blockId: string) => {
    dragSourceRef.current = blockId;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", blockId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(blockId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      setDragOverId(null);
      const sourceId = dragSourceRef.current;
      if (!sourceId || sourceId === targetId) return;

      const source = blocks.find((b) => b.id === sourceId);
      const target = blocks.find((b) => b.id === targetId);
      if (!source || !target) return;

      const newOrder = target.order;
      const updated = blocks.map((b) => {
        if (b.id === sourceId) return { ...b, order: newOrder };
        if (b.id !== sourceId && b.order >= newOrder && b.parentId === source.parentId)
          return { ...b, order: b.order + 1 };
        return b;
      });

      setBlocks(updated);

      const changed: { id: string; order: number }[] = [];
      for (const b of updated) {
        const orig = blocks.find((o) => o.id === b.id);
        if (orig && orig.order !== b.order) changed.push({ id: b.id, order: b.order });
      }
      if (changed.length > 0) {
        store.reorderBlocks(changed);
      }
      dragSourceRef.current = null;
    },
    [blocks, store]
  );

  const updateBlockProps = useCallback(
    (blockId: string, newProps: Record<string, unknown>) => {
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === blockId ? { ...b, properties: JSON.stringify({ ...JSON.parse(b.properties || "{}"), ...newProps }) } : b
        )
      );
      saveBlock(blockId, {
        properties: JSON.stringify({ ...JSON.parse(blocks.find((b) => b.id === blockId)?.properties || "{}"), ...newProps }),
      } as Partial<Block>);
    },
    [saveBlock, blocks]
  );

  const renderBlock = (block: Block) => {
    const depth = computeDepth(blocks, block.id);
    const indent = depth * 24;
    const placeholder = blockPlaceholders[block.type] || "Type / for commands";
    const props = JSON.parse(block.properties || "{}");
    const isFocused = focusedBlockId === block.id;
    const isDragOver = dragOverId === block.id;

    const sharedProps = {
      contentEditable: true as const,
      suppressContentEditableWarning: true,
      onInput: (e: React.FormEvent<HTMLElement>) =>
        handleBlockContent(block.id, e.currentTarget.textContent || ""),
      onFocus: () => setFocusedBlockId(block.id),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, block, orderedBlocks.indexOf(block)),
      "data-placeholder": placeholder,
    };

    const blockStyle = { marginLeft: `${indent}px` };

    if (block.type === "toggle") {
      const isOpen = props.open !== false;
      return (
        <div key={block.id} style={blockStyle}>
          <div className="flex gap-1 items-start">
            <button
              onClick={() => updateBlockProps(block.id, { open: !isOpen })}
              className="mt-1 p-0.5 rounded hover:bg-[var(--bg-hover)] transition-colors flex-shrink-0"
            >
              <svg
                className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${isOpen ? "rotate-90" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span
              ref={(el) => setBlockRef(block.id, el)}
              {...sharedProps}
              className="flex-1 outline-none text-[var(--text-secondary)]"
            />
          </div>
        </div>
      );
    }

    if (block.type === "callout") {
      const color = calloutColors.find((c) => c.label === (props.color || "Default")) || calloutColors[0];
      return (
        <div key={block.id} className={`flex gap-3 rounded-lg p-4 ${color.bg} ${color.border} border`} style={blockStyle}>
          <button
            onClick={() => {
              const emoji = props.icon || "💡";
              const next = emojis[(emojis.indexOf(emoji) + 1) % emojis.length];
              updateBlockProps(block.id, { icon: next });
            }}
            className="text-xl flex-shrink-0 hover:opacity-80"
          >
            {props.icon || "💡"}
          </button>
          <span
            ref={(el) => setBlockRef(block.id, el)}
            {...sharedProps}
            className="flex-1 outline-none text-[var(--text-secondary)]"
          />
          <button
            onClick={() => setShowColorPicker(showColorPicker === block.id ? null : block.id)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-hover)] transition-all flex-shrink-0 self-start"
          >
            <svg className="h-4 w-4 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </button>
          {showColorPicker === block.id && (
            <div ref={colorPickerRef} className="absolute right-0 top-full mt-1 p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-sidebar)] shadow-2xl z-50 flex gap-1">
              {calloutColors.map((c) => (
                <button
                  key={c.label}
                  onClick={() => { updateBlockProps(block.id, { color: c.label }); setShowColorPicker(null); }}
                  className={`w-6 h-6 rounded-full ${c.bg} ${c.border} border hover:scale-110 transition-transform ${props.color === c.label ? "ring-2 ring-[var(--accent)]" : ""}`}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    if (block.type === "image") {
      const url = props.url || "";
      const imgWidth = props.width || 100;
      const handleImageMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        resizeRef.current = { blockId: block.id, startX: e.clientX, startW: imgWidth };
        const handleMove = (ev: MouseEvent) => {
          const r = resizeRef.current;
          if (!r) return;
          const diff = ev.clientX - r.startX;
          const parentW = (ev.target as HTMLElement).closest(".relative")?.parentElement?.clientWidth || 1;
          const pct = Math.max(20, Math.min(100, r.startW + (diff / parentW) * 100));
          setBlocks((prev) => prev.map((b) =>
            b.id === r.blockId
              ? { ...b, properties: JSON.stringify({ ...JSON.parse(b.properties || "{}"), width: Math.round(pct) }) }
              : b
          ));
        };
        const handleUp = () => {
          const r = resizeRef.current;
          if (r) {
            const finalProps = JSON.parse(blocks.find((b) => b.id === r.blockId)?.properties || "{}");
            saveBlock(r.blockId, { properties: JSON.stringify(finalProps) } as Partial<Block>);
          }
          resizeRef.current = null;
          document.removeEventListener("mousemove", handleMove);
          document.removeEventListener("mouseup", handleUp);
        };
        document.addEventListener("mousemove", handleMove);
        document.addEventListener("mouseup", handleUp);
      };

      return (
        <div key={block.id} className="space-y-2" style={blockStyle}>
          {url ? (
            <div className="relative group inline-block">
              <div className="relative" style={{ width: `${imgWidth}%` }}>
                <img src={url} alt="" className="w-full rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div
                  onMouseDown={handleImageMouseDown}
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize bg-transparent hover:bg-[var(--accent)] transition-colors rounded-r-lg opacity-0 group-hover:opacity-100"
                />
              </div>
              <button
                onClick={() => updateBlockProps(block.id, { url: "", width: 100 })}
                className="absolute top-2 right-2 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={url}
                onChange={(e) => updateBlockProps(block.id, { url: e.target.value })}
                placeholder="Paste image URL..."
                className="flex-1 bg-[var(--bg-code)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none placeholder-[var(--text-dim)]"
              />
            </div>
          )}
          <span
            ref={(el) => setBlockRef(block.id, el)}
            {...sharedProps}
            className="block text-sm text-[var(--text-dim)] outline-none min-h-[1.5em]"
            data-placeholder="Caption..."
          />
        </div>
      );
    }

    if (block.type === "divider") {
      return <hr key={block.id} className="my-2 border-[var(--border)]" style={blockStyle} />;
    }

    switch (block.type) {
      case "h1":
        return (
          <h1 key={`${block.id}-${block.type}`} ref={(el) => setBlockRef(block.id, el)} {...sharedProps}
            className="text-4xl font-bold outline-none text-[var(--text-primary)]" style={blockStyle} />
        );
      case "h2":
        return (
          <h2 key={`${block.id}-${block.type}`} ref={(el) => setBlockRef(block.id, el)} {...sharedProps}
            className="text-2xl font-semibold outline-none text-[var(--text-secondary)]" style={blockStyle} />
        );
      case "h3":
        return (
          <h3 key={`${block.id}-${block.type}`} ref={(el) => setBlockRef(block.id, el)} {...sharedProps}
            className="text-xl font-semibold outline-none text-[var(--text-secondary)]" style={blockStyle} />
        );
      case "bullet":
        return (
          <div className="flex gap-2" key={`${block.id}-${block.type}`} style={blockStyle}>
            <span className="text-[var(--text-muted)] mt-0.5 select-none">•</span>
            <span ref={(el) => setBlockRef(block.id, el)} {...sharedProps} className="flex-1 outline-none text-[var(--text-secondary)]" />
          </div>
        );
      case "numbered":
        return (
          <div className="flex gap-2" key={`${block.id}-${block.type}`} style={blockStyle}>
            <span className="text-[var(--text-muted)] mt-0.5 min-w-[1.5em] select-none">
              {orderedBlocks.filter((b) => b.type === "numbered" && b.parentId === block.parentId).findIndex((b) => b.id === block.id) + 1}.
            </span>
            <span ref={(el) => setBlockRef(block.id, el)} {...sharedProps} className="flex-1 outline-none text-[var(--text-secondary)]" />
          </div>
        );
      case "todo":
        return (
          <div className="flex gap-2" key={`${block.id}-${block.type}`} style={blockStyle}>
            <input type="checkbox" checked={props.checked || false}
              onChange={(e) => updateBlockProps(block.id, { checked: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-card)] text-[var(--accent)] focus:ring-[var(--accent)]" />
            <span ref={(el) => setBlockRef(block.id, el)} {...sharedProps}
              className={`flex-1 outline-none text-[var(--text-secondary)] ${props.checked ? "line-through text-[var(--text-dim)]" : ""}`} />
          </div>
        );
      case "quote":
        return (
          <div className="border-l-4 border-[var(--border)] pl-4" key={`${block.id}-${block.type}`} style={blockStyle}>
            <span ref={(el) => setBlockRef(block.id, el)} {...sharedProps}
              className="outline-none block italic text-[var(--text-muted)]" />
          </div>
        );
      case "code":
        return (
          <div className="rounded-lg bg-[var(--bg-code)] p-4 border border-[var(--border)] overflow-x-auto" key={`${block.id}-${block.type}`} style={blockStyle}>
            <code ref={(el) => setBlockRef(block.id, el)} {...sharedProps}
              className="text-sm text-[var(--text-primary)] font-mono outline-none block whitespace-pre" />
          </div>
        );
      default:
        return (
          <span key={`${block.id}-${block.type}`} ref={(el) => setBlockRef(block.id, el)} {...sharedProps}
            className="outline-none min-h-[1.5em] block text-[var(--text-secondary)]" style={blockStyle} />
        );
    }
  };

  return (
    <div ref={editorRef} className="max-w-[var(--editor-max-width)] mx-auto py-12 px-16 min-h-full">
      <div className="mb-8 animate-fade-in-up">
        <div className="relative inline-block mb-4">
          <button onClick={() => setShowIconPicker(!showIconPicker)}
            className="text-5xl hover:opacity-80 transition-opacity">
            {icon || "📄"}
          </button>
          {showIconPicker && (
            <div ref={iconPickerRef}
              className="absolute top-full left-0 mt-2 w-72 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] shadow-2xl z-50">
              <div className="grid grid-cols-8 gap-1">
                {emojis.map((e) => (
                  <button key={e} onClick={() => { setIcon(e); setShowIconPicker(false); saveIcon(e); }}
                    className={`text-lg p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors ${icon === e ? "bg-[var(--bg-active)]" : ""}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <input value={title} onChange={(e) => { setTitle(e.target.value); saveTitle(e.target.value); }}
          placeholder="Untitled"
          className="w-full text-4xl font-bold outline-none placeholder-[var(--placeholder)] bg-transparent text-[var(--text-primary)]" />
      </div>

      <div className="space-y-0.5">
        {orderedBlocks.map((block) => (
          <div
            key={block.id}
            draggable
            onDragStart={(e) => handleDragStart(e, block.id)}
            onDragOver={(e) => handleDragOver(e, block.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, block.id)}
            className={`group relative rounded-lg px-1 transition-all duration-150 ${
              focusedBlockId === block.id ? "bg-[var(--bg-block-focus)] shadow-sm" : ""
            } ${dragOverId === block.id ? "border-t-2 border-[var(--accent)]" : ""}`}
          >
            <div className="flex items-start gap-1">
              <div className="flex items-center pt-1 pr-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => setShowTypeMenu(showTypeMenu === block.id ? null : block.id)}
                  className="p-0.5 rounded hover:bg-[var(--bg-hover)] transition-colors cursor-grab active:cursor-grabbing"
                >
                  <svg className="h-4 w-4 text-[var(--text-dim)]" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
                    <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
                    <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 min-w-0">
                {renderBlock(block)}
              </div>

              {showTypeMenu === block.id && (
                <div ref={menuRef} className="absolute right-0 bottom-full mb-1 w-48 rounded-lg border border-[var(--border)] bg-[var(--bg-sidebar)] shadow-2xl z-50 py-1 max-h-64 overflow-y-auto">
                  {blockTypes.map((type) => (
                    <button key={type.value} onClick={() => changeBlockType(block.id, type.value)}
                      className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                        block.type === type.value
                          ? "text-[var(--text-primary)] bg-[var(--bg-active)]"
                          : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
                      }`}>
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            const lastOrder = blocks.reduce((max, b) => Math.max(max, b.order), -1);
            addBlock(lastOrder);
          }}
          className="w-full text-left px-8 py-1 text-sm text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
        >
          Click to add a block or type / for commands
        </button>
      </div>
    </div>
  );
}
