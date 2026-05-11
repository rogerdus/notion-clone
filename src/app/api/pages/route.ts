import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { title, icon, groupId } = await request.json();

  const maxOrder = await prisma.page.aggregate({
    where: { userId: session.user.id },
    _max: { order: true },
  });

  const page = await prisma.page.create({
    data: {
      title: title || "Untitled",
      icon: icon || "📄",
      userId: session.user.id,
      groupId: groupId || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  await prisma.block.create({
    data: {
      type: "text",
      content: "",
      pageId: page.id,
      order: 0,
    },
  });

  return NextResponse.json(page);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const pages = await prisma.page.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(pages);
}
