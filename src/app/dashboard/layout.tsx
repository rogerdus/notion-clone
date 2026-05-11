import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import QuickSearch from "@/components/QuickSearch";
import TabEasterEgg from "@/components/TabEasterEgg";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [pages, groups] = await Promise.all([
    prisma.page.findMany({
      where: { userId: session.user.id },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        icon: true,
        userId: true,
        parentId: true,
        groupId: true,
        isFavorite: true,
        createdAt: true,
        updatedAt: true,
        order: true,
      },
    }),
    prisma.pageGroup.findMany({
      where: { userId: session.user.id },
      orderBy: { order: "asc" },
    }),
  ]);

  const serializedPages = pages.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const serializedGroups = groups.map((g) => ({
    ...g,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-page)]">
      <TabEasterEgg />
      <Sidebar pages={serializedPages} groups={serializedGroups} />
      <main className="flex-1 overflow-y-auto bg-[var(--bg-page)]">{children}</main>
      <QuickSearch />
    </div>
  );
}
