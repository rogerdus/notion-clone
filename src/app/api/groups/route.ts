import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { name, icon } = await request.json();

  const maxOrder = await prisma.pageGroup.aggregate({
    where: { userId: session.user.id },
    _max: { order: true },
  });

  const group = await prisma.pageGroup.create({
    data: {
      name: name || "New Group",
      icon: icon || "📁",
      userId: session.user.id,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(group);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const groups = await prisma.pageGroup.findMany({
    where: { userId: session.user.id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(groups);
}
