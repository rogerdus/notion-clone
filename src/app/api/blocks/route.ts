import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

async function verifyPageAccess(pageId: string, userId: string) {
  const page = await prisma.page.findUnique({ where: { id: pageId } });
  return page?.userId === userId;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { type, content, pageId, order, parentId } = await request.json();

  const canAccess = await verifyPageAccess(pageId, session.user.id);
  if (!canAccess) {
    return new NextResponse("Not found", { status: 404 });
  }

  const block = await prisma.block.create({
    data: {
      type: type || "text",
      content: content || "",
      pageId,
      order: order ?? 0,
      parentId: parentId || null,
    },
  });

  return NextResponse.json(block);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id, ...updates } = await request.json();

  const block = await prisma.block.findUnique({
    where: { id },
    include: { page: true },
  });

  if (!block || block.page.userId !== session.user.id) {
    return new NextResponse("Not found", { status: 404 });
  }

  const updated = await prisma.block.update({
    where: { id },
    data: updates,
  });

  return NextResponse.json(updated);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { blocks: updates } = await request.json();

  const block = await prisma.block.findUnique({
    where: { id: updates[0]?.id },
    include: { page: true },
  });
  if (!block || block.page.userId !== session.user.id) {
    return new NextResponse("Not found", { status: 404 });
  }

  for (const u of updates) {
    await prisma.block.update({ where: { id: u.id }, data: { order: u.order } });
  }

  return new NextResponse(null, { status: 200 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await request.json();

  const block = await prisma.block.findUnique({
    where: { id },
    include: { page: true },
  });

  if (!block || block.page.userId !== session.user.id) {
    return new NextResponse("Not found", { status: 404 });
  }

  await prisma.block.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
