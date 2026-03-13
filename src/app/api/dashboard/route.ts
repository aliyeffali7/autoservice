import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
  }

  const [totalOrders, notStarted, inProgress, done, mechanics, allOrders, allProducts] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "NOT_STARTED" } }),
      prisma.order.count({ where: { status: "IN_PROGRESS" } }),
      prisma.order.count({ where: { status: "DONE" } }),
      prisma.user.count({ where: { role: "MECHANIC" } }),
      prisma.order.findMany({
        where: { status: "DONE" },
        include: { tasks: true, products: true },
      }),
      prisma.product.findMany(),
    ]);

  const revenue = allOrders.reduce((acc, order) => {
    const taskTotal = order.tasks.reduce((s, t) => s + t.price, 0);
    const productTotal = order.products.reduce((s, p) => s + p.priceAtTime * p.quantity, 0);
    return acc + taskTotal + productTotal;
  }, 0);

  const lowStock = allProducts.filter((p) => p.quantity <= p.lowStockThreshold);

  return NextResponse.json({
    totalOrders,
    notStarted,
    inProgress,
    done,
    mechanics,
    revenue,
    lowStock,
  });
}
