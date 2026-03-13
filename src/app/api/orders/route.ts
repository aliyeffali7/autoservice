import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

  if (session.user.role === "OWNER") {
    const orders = await prisma.order.findMany({
      include: {
        mechanic: { select: { id: true, name: true, surname: true } },
        tasks: true,
        products: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } else {
    const orders = await prisma.order.findMany({
      where: { mechanicId: session.user.id },
      include: {
        tasks: true,
        products: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
  }

  const body = await request.json();
  const { carBrand, carModel, carPlate, description, mechanicId, tasks, products, customerName, customerSurname, customerPhone } = body;

  if (!carBrand || !carModel || !carPlate || !mechanicId) {
    return NextResponse.json({ error: "Tələb olunan sahələr doldurulmayıb" }, { status: 400 });
  }

  // Deduct stock for each product
  if (products && products.length > 0) {
    for (const p of products) {
      const product = await prisma.product.findUnique({ where: { id: p.productId } });
      if (!product) {
        return NextResponse.json({ error: `Məhsul tapılmadı: ${p.productId}` }, { status: 400 });
      }
      if (product.quantity < p.quantity) {
        return NextResponse.json(
          { error: `"${product.name}" məhsulundan yetəri qədər yoxdur (${product.quantity} ədəd mövcuddur)` },
          { status: 400 }
        );
      }
    }

    for (const p of products) {
      await prisma.product.update({
        where: { id: p.productId },
        data: { quantity: { decrement: p.quantity } },
      });
    }
  }

  const order = await prisma.order.create({
    data: {
      carBrand,
      carModel,
      carPlate,
      description,
      mechanicId,
      customerName,
      customerSurname,
      customerPhone,
      tasks: tasks?.length
        ? { create: tasks.map((t: { description: string; price: number }) => ({ description: t.description, price: t.price })) }
        : undefined,
      products: products?.length
        ? {
            create: products.map((p: { productId: string; quantity: number; priceAtTime: number }) => ({
              productId: p.productId,
              quantity: p.quantity,
              priceAtTime: p.priceAtTime,
            })),
          }
        : undefined,
    },
    include: {
      mechanic: { select: { id: true, name: true, surname: true } },
      tasks: true,
      products: { include: { product: { select: { name: true } } } },
    },
  });

  return NextResponse.json(order, { status: 201 });
}
