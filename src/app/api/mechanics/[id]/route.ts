import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, surname, phone, password } = body;

  const data: Record<string, string> = { name, surname, phone };
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  const mechanic = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, surname: true, phone: true, createdAt: true },
  });

  return NextResponse.json(mechanic);
}
