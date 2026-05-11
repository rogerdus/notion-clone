"use client";

import { useStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import BlockEditor from "@/components/BlockEditor";

export default function PageEditor() {
  const { user, pages, getBlocks } = useStore();
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;

  const page = pages.find((p) => p.id === pageId);
  const blocks = getBlocks(pageId);

  useEffect(() => {
    if (!user) router.replace("/");
  }, [user, router]);

  if (!user || !page) return null;

  if (page.userId !== user.id) {
    router.replace("/dashboard");
    return null;
  }

  return (
    <BlockEditor
      pageId={page.id}
      initialBlocks={blocks}
      pageTitle={page.title}
      pageIcon={page.icon}
    />
  );
}
