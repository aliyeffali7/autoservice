"use client";

import { useEffect, useState } from "react";

type Task = { id: string; description: string; price: number };
type OrderProduct = {
  id: string;
  productId: string;
  quantity: number;
  priceAtTime: number;
  product: { name: string };
};
type Product = { id: string; name: string; quantity: number; sellPrice: number };

type Order = {
  id: string;
  carBrand: string;
  carModel: string;
  carPlate: string;
  description: string;
  status: string;
  paymentStatus: string;
  tasks: Task[];
  products: OrderProduct[];
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Başlanmayıb",
  IN_PROGRESS: "İşlənir",
  DONE: "Tamamlandı",
};

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  DONE: "bg-green-100 text-green-700",
};

const NEXT_STATUS: Record<string, string> = {
  NOT_STARTED: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "DONE",
};

const STATUS_BTN: Record<string, string> = {
  NOT_STARTED: "Başla",
  IN_PROGRESS: "Tamamla",
  DONE: "Tamamlandı",
};

export default function MechanicDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [warehouseProducts, setWarehouseProducts] = useState<Product[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    fetch("/api/warehouse").then((r) => r.json()).then((data) => {
      setWarehouseProducts(data);
      if (data.length > 0) setSelectedProductId(data[0].id);
    });
  }, []);

  async function fetchOrders() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data);
    if (activeOrder) {
      const updated = data.find((o: Order) => o.id === activeOrder.id);
      if (updated) setActiveOrder(updated);
    }
  }

  async function handleStatusChange(order: Order) {
    const next = NEXT_STATUS[order.status];
    if (next === order.status) return;

    setStatusLoading(order.id);
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setStatusLoading(null);
    fetchOrders();
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrder || !selectedProductId) return;
    setAddError("");
    setAddLoading(true);

    const res = await fetch(`/api/orders/${activeOrder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newProduct: { productId: selectedProductId, quantity: selectedQty },
      }),
    });

    const data = await res.json();
    setAddLoading(false);

    if (!res.ok) {
      setAddError(data.error || "Xəta baş verdi");
      return;
    }

    setAddingProduct(false);
    setSelectedQty(1);
    fetchOrders();
    // Re-fetch warehouse to update quantities
    fetch("/api/warehouse").then((r) => r.json()).then((d) => {
      setWarehouseProducts(d);
      if (d.length > 0 && !selectedProductId) setSelectedProductId(d[0].id);
    });
  }

  function calcTotal(order: Order) {
    const taskTotal = order.tasks.reduce((s, t) => s + t.price, 0);
    const productTotal = order.products.reduce((s, p) => s + p.priceAtTime * p.quantity, 0);
    return (taskTotal + productTotal).toFixed(2);
  }

  const grouped = {
    NOT_STARTED: orders.filter((o) => o.status === "NOT_STARTED"),
    IN_PROGRESS: orders.filter((o) => o.status === "IN_PROGRESS"),
    DONE: orders.filter((o) => o.status === "DONE"),
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Mənim Sifarişlərim</h1>

      {orders.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-slate-400">
          <div className="text-5xl mb-3">🔧</div>
          Sizə hələ sifariş təyin edilməyib
        </div>
      )}

      <div className="space-y-8">
        {(["IN_PROGRESS", "NOT_STARTED", "DONE"] as const).map((status) => {
          const group = grouped[status];
          if (group.length === 0) return null;
          return (
            <div key={status}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {STATUS_LABELS[status]} ({group.length})
              </h2>
              <div className="space-y-4">
                {group.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-lg font-bold text-slate-800">
                            {order.carBrand} {order.carModel}
                          </span>
                          <span className="text-sm font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {order.carPlate}
                          </span>
                        </div>
                        {order.description && (
                          <p className="text-sm text-slate-500">{order.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}
                        >
                          {STATUS_LABELS[order.status]}
                        </span>
                        {order.status !== "DONE" && (
                          <button
                            onClick={() => handleStatusChange(order)}
                            disabled={statusLoading === order.id}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {statusLoading === order.id ? "..." : STATUS_BTN[order.status]}
                          </button>
                        )}
                      </div>
                    </div>

                    {order.tasks.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-slate-600 mb-2">Tapşırıqlar:</div>
                        <div className="space-y-1">
                          {order.tasks.map((t) => (
                            <div
                              key={t.id}
                              className="flex justify-between text-sm py-2 px-3 bg-slate-50 rounded-lg"
                            >
                              <span className="text-slate-700">{t.description}</span>
                              <span className="font-medium text-slate-800">{t.price} ₼</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {order.products.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-slate-600 mb-2">Məhsullar:</div>
                        <div className="space-y-1">
                          {order.products.map((p) => (
                            <div
                              key={p.id}
                              className="flex justify-between text-sm py-2 px-3 bg-slate-50 rounded-lg"
                            >
                              <span className="text-slate-700">
                                {p.product.name} × {p.quantity}
                              </span>
                              <span className="font-medium text-slate-800">
                                {(p.priceAtTime * p.quantity).toFixed(2)} ₼
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-sm font-bold text-slate-700">
                        Cəmi: {calcTotal(order)} ₼
                      </span>
                      {order.status !== "DONE" && (
                        <button
                          onClick={() => {
                            setActiveOrder(order);
                            setAddingProduct(true);
                            setAddError("");
                            setSelectedQty(1);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          + Məhsul əlavə et
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Product Modal */}
      {addingProduct && activeOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Məhsul əlavə et</h2>
            <p className="text-sm text-slate-500 mb-6">
              {activeOrder.carBrand} {activeOrder.carModel} — {activeOrder.carPlate}
            </p>

            {warehouseProducts.length === 0 ? (
              <div className="text-center text-slate-400 py-6">Anbar boşdur</div>
            ) : (
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Məhsul</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {warehouseProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.quantity} ədəd mövcuddur)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Miqdar</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(Number(e.target.value))}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {addError && (
                  <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
                    {addError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddingProduct(false)}
                    className="flex-1 border border-slate-200 text-slate-700 rounded-lg py-2.5 font-medium hover:bg-slate-50 transition-colors"
                  >
                    Ləğv et
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50"
                  >
                    {addLoading ? "Əlavə edilir..." : "Əlavə et"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
