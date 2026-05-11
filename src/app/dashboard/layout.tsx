"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import QuickSearch from "@/components/QuickSearch";
import TabEasterEgg from "@/components/TabEasterEgg";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, pages, groups } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace("/");
  }, [user, router]);

  if (!user) return null;

  const sortedPages = [...pages].sort((a, b) => a.order - b.order);
  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-page)]">
      <TabEasterEgg />
      <Sidebar pages={sortedPages} groups={sortedGroups} />
      <main className="flex-1 overflow-y-auto bg-[var(--bg-page)]">{children}</main>
      <QuickSearch />
    </div>
  );
}
