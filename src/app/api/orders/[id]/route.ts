import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      mechanic: { select: { id: true, name: true, surname: true } },
      tasks: true,
      products: { include: { product: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Sifariş tapılmadı" }, { status: 404 });

  if (session.user.role === "MECHANIC" && order.mechanicId !== session.user.id) {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
  }

  return NextResponse.json(order);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Sifariş tapılmadı" }, { status: 404 });

  if (session.user.role === "MECHANIC" && order.mechanicId !== session.user.id) {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
  }

  // Mechanic can only update status, paymentStatus and add products
  if (session.user.role === "MECHANIC") {
    const { status, paymentStatus, newProduct } = body;

    if (newProduct) {
      const product = await prisma.product.findUnique({ where: { id: newProduct.productId } });
      if (!product) return NextResponse.json({ error: "Məhsul tapılmadı" }, { status: 400 });
      if (product.quantity < newProduct.quantity) {
        return NextResponse.json(
          { error: `"${product.name}" məhsulundan yetəri qədər yoxdur (${product.quantity} ədəd)` },
          { status: 400 }
        );
      }
      await prisma.product.update({
        where: { id: newProduct.productId },
        data: { quantity: { decrement: newProduct.quantity } },
      });
      await prisma.orderProduct.create({
        data: {
          orderId: id,
          productId: newProduct.productId,
          quantity: newProduct.quantity,
          priceAtTime: product.sellPrice,
        },
      });
    }

    const updateData: Record<string, string> = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        tasks: true,
        products: { include: { product: true } },
      },
    });
    return NextResponse.json(updated);
  }

  // Owner can update everything
  const { carBrand, carModel, carPlate, description, mechanicId, status, paymentStatus, customerName, customerSurname, customerPhone } = body;
  const updated = await prisma.order.update({
    where: { id },
    data: { carBrand, carModel, carPlate, description, mechanicId, status, paymentStatus, customerName, customerSurname, customerPhone },
    include: {
      mechanic: { select: { id: true, name: true, surname: true } },
      tasks: true,
      products: { include: { product: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
