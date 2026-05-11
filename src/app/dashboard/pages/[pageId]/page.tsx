import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import BlockEditor from "@/components/BlockEditor";
import type { Block, Page } from "@/lib/types";

export default async function PageEditor({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { pageId } = await params;

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: {
      blocks: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!page || page.userId !== session.user.id) notFound();

  return (
    <BlockEditor
      pageId={page.id}
      initialBlocks={page.blocks as unknown as Block[]}
      pageTitle={page.title}
      pageIcon={page.icon}
    />
  );
}
