import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
  }

  const body = await request.json();
  const { name, quantity, purchasePrice, sellPrice, lowStockThreshold } = body;

  if (!name || purchasePrice === undefined || sellPrice === undefined) {
    return NextResponse.json({ error: "Tələb olunan sahələr doldurulmayıb" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name,
      quantity: quantity || 0,
      purchasePrice,
      sellPrice,
      lowStockThreshold: lowStockThreshold || 5,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
