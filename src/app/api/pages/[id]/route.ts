import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const page = await prisma.page.findUnique({ where: { id } });
  if (!page || page.userId !== session.user.id) {
    return new NextResponse("Not found", { status: 404 });
  }

  const updated = await prisma.page.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const page = await prisma.page.findUnique({ where: { id } });
  if (!page || page.userId !== session.user.id) {
    return new NextResponse("Not found", { status: 404 });
  }

  await prisma.page.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
