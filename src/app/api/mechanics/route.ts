import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
  }

  const mechanics = await prisma.user.findMany({
    where: { role: "MECHANIC" },
    select: { id: true, name: true, surname: true, phone: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(mechanics);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
  }

  const body = await request.json();
  const { name, surname, phone, password } = body;

  if (!name || !surname || !phone || !password) {
    return NextResponse.json({ error: "Bütün sahələr tələb olunur" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: "Bu telefon nömrəsi artıq istifadə olunur" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const mechanic = await prisma.user.create({
    data: { name, surname, phone, password: hashed, role: "MECHANIC" },
    select: { id: true, name: true, surname: true, phone: true, createdAt: true },
  });

  return NextResponse.json(mechanic, { status: 201 });
}
