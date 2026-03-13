"use client";

import { useEffect, useState } from "react";

type Task = { id?: string; description: string; price: number };
type OrderProduct = {
  id: string;
  productId: string;
  quantity: number;
  priceAtTime: number;
  product: { name: string };
};
type Mechanic = { id: string; name: string; surname: string };
type Product = { id: string; name: string; quantity: number; sellPrice: number };

type Order = {
  id: string;
  carBrand: string;
  carModel: string;
  carPlate: string;
  description: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  customerSurname: string;
  customerPhone: string;
  mechanic: Mechanic;
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

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "Ödəniş gözlənilir",
  PAID: "Ödəniş tamamlandı",
  LOAN: "Borc",
};

const PAYMENT_COLORS: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-500",
  PAID: "bg-green-100 text-green-700",
  LOAN: "bg-amber-100 text-amber-700",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [carBrand, setCarBrand] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carPlate, setCarPlate] = useState("");
  const [description, setDescription] = useState("");
  const [mechanicId, setMechanicId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerSurname, setCustomerSurname] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tasks, setTasks] = useState<Task[]>([{ description: "", price: 0 }]);
  const [selectedProducts, setSelectedProducts] = useState<
    { productId: string; quantity: number; priceAtTime: number }[]
  >([]);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const [ordersRes, mechanicsRes, productsRes] = await Promise.all([
      fetch("/api/orders"),
      fetch("/api/mechanics"),
      fetch("/api/warehouse"),
    ]);
    setOrders(await ordersRes.json());
    setMechanics(await mechanicsRes.json());
    setProducts(await productsRes.json());
  }

  function openCreate() {
    setCarBrand("");
    setCarModel("");
    setCarPlate("");
    setDescription("");
    setMechanicId("");
    setCustomerName("");
    setCustomerSurname("");
    setCustomerPhone("");
    setTasks([{ description: "", price: 0 }]);
    setSelectedProducts([]);
    setError("");
    setShowModal(true);
  }

  function addTask() {
    setTasks([...tasks, { description: "", price: 0 }]);
  }

  function removeTask(i: number) {
    setTasks(tasks.filter((_, idx) => idx !== i));
  }

  function updateTask(i: number, field: keyof Task, value: string | number) {
    const updated = [...tasks];
    updated[i] = { ...updated[i], [field]: value };
    setTasks(updated);
  }

  function addProduct() {
    if (products.length === 0) return;
    setSelectedProducts([
      ...selectedProducts,
      { productId: products[0].id, quantity: 1, priceAtTime: products[0].sellPrice },
    ]);
  }

  function removeProduct(i: number) {
    setSelectedProducts(selectedProducts.filter((_, idx) => idx !== i));
  }

  function updateSelectedProduct(i: number, productId: string, quantity: number) {
    const product = products.find((p) => p.id === productId);
    const updated = [...selectedProducts];
    updated[i] = {
      productId,
      quantity,
      priceAtTime: product?.sellPrice || 0,
    };
    setSelectedProducts(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const validTasks = tasks.filter((t) => t.description.trim());
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carBrand,
          carModel,
          carPlate,
          description,
          mechanicId,
          customerName,
          customerSurname,
          customerPhone,
          tasks: validTasks,
          products: selectedProducts,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Xəta baş verdi");
        return;
      }

      setShowModal(false);
      fetchAll();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu sifarişi silmək istədiyinizə əminsiniz?")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    fetchAll();
  }

  async function handlePaymentUpdate(id: string, paymentStatus: string) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus }),
    });
    fetchAll();
  }

  function calcTotal(order: Order) {
    const taskTotal = order.tasks.reduce((s, t) => s + t.price, 0);
    const productTotal = order.products.reduce((s, p) => s + p.priceAtTime * p.quantity, 0);
    return (taskTotal + productTotal).toFixed(2);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Sifarişlər</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          + Sifariş yarat
        </button>
      </div>

      <div className="space-y-4">
        {orders.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-slate-400">
            <div className="text-5xl mb-3">📋</div>
            Hələ sifariş yoxdur
          </div>
        )}
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg font-bold text-slate-800">
                    {order.carBrand} {order.carModel}
                  </span>
                  <span className="text-sm font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {order.carPlate}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className="text-sm text-slate-500">
                  Mexanik: {order.mechanic.name} {order.mechanic.surname}
                </div>
                {(order.customerName || order.customerPhone) && (
                  <div className="text-sm text-slate-500 mt-0.5">
                    Müştəri: {[order.customerName, order.customerSurname].filter(Boolean).join(" ")}
                    {order.customerPhone && <span className="ml-2 text-slate-400">{order.customerPhone}</span>}
                  </div>
                )}
                {order.description && (
                  <div className="text-sm text-slate-600 mt-1">{order.description}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-800">{calcTotal(order)} ₼</div>
                {order.status === "DONE" && (
                  <div className="mt-1">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PAYMENT_COLORS[order.paymentStatus] || PAYMENT_COLORS.PENDING}`}>
                      {PAYMENT_LABELS[order.paymentStatus] || PAYMENT_LABELS.PENDING}
                    </span>
                  </div>
                )}
                <div className="text-xs text-slate-400 mt-1">
                  {new Date(order.createdAt).toLocaleDateString("az-AZ")}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setViewOrder(order)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Ətraflı bax
              </button>
              {order.status === "DONE" && order.paymentStatus !== "PAID" && (
                <button
                  onClick={() => handlePaymentUpdate(order.id, "PAID")}
                  className="text-green-700 hover:text-green-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors border border-green-200"
                >
                  Ödəniş alındı
                </button>
              )}
              {order.status === "DONE" && order.paymentStatus !== "LOAN" && order.paymentStatus !== "PAID" && (
                <button
                  onClick={() => handlePaymentUpdate(order.id, "LOAN")}
                  className="text-amber-700 hover:text-amber-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors border border-amber-200"
                >
                  Borc qeyd et
                </button>
              )}
              {order.status === "DONE" && order.paymentStatus === "LOAN" && (
                <button
                  onClick={() => handlePaymentUpdate(order.id, "PAID")}
                  className="text-green-700 hover:text-green-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors border border-green-200"
                >
                  Borcu ödədi
                </button>
              )}
              <button
                onClick={() => handleDelete(order.id)}
                className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 my-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Yeni sifariş</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Avtomobil Markası
                  </label>
                  <input
                    value={carBrand}
                    onChange={(e) => setCarBrand(e.target.value)}
                    required
                    placeholder="BMW, Toyota..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                  <input
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    required
                    placeholder="X5, Camry..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Qeydiyyat Nişanı
                  </label>
                  <input
                    value={carPlate}
                    onChange={(e) => setCarPlate(e.target.value)}
                    required
                    placeholder="10-AB-123"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Açıqlama (isteğe bağlı)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mexanik</label>
                <select
                  value={mechanicId}
                  onChange={(e) => setMechanicId(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Mexanik seçin</option>
                  {mechanics.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.surname}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Info */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Müştəri məlumatları</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ad"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      value={customerSurname}
                      onChange={(e) => setCustomerSurname(e.target.value)}
                      placeholder="Soyad"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Telefon"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Tapşırıqlar</label>
                  <button
                    type="button"
                    onClick={addTask}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Tapşırıq əlavə et
                  </button>
                </div>
                <div className="space-y-2">
                  {tasks.map((task, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input
                        value={task.description}
                        onChange={(e) => updateTask(i, "description", e.target.value)}
                        placeholder="Tapşırıq təsviri"
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={task.price}
                        onChange={(e) => updateTask(i, "price", Number(e.target.value))}
                        placeholder="Qiymət"
                        className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      {tasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTask(i)}
                          className="text-red-500 hover:text-red-600 px-2 py-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">
                    İstifadə ediləcək məhsullar
                  </label>
                  <button
                    type="button"
                    onClick={addProduct}
                    disabled={products.length === 0}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-40"
                  >
                    + Məhsul əlavə et
                  </button>
                </div>
                {products.length === 0 && (
                  <p className="text-sm text-slate-400">Anbar boşdur. Əvvəlcə məhsul əlavə edin.</p>
                )}
                <div className="space-y-2">
                  {selectedProducts.map((sp, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select
                        value={sp.productId}
                        onChange={(e) => updateSelectedProduct(i, e.target.value, sp.quantity)}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.quantity} ədəd - {p.sellPrice} ₼)
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={sp.quantity}
                        onChange={(e) =>
                          updateSelectedProduct(i, sp.productId, Number(e.target.value))
                        }
                        className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeProduct(i)}
                        className="text-red-500 hover:text-red-600 px-2 py-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-700 rounded-lg py-2.5 font-medium hover:bg-slate-50 transition-colors"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? "Yaradılır..." : "Sifariş yarat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {viewOrder.carBrand} {viewOrder.carModel}
                </h2>
                <div className="text-slate-500 text-sm">{viewOrder.carPlate}</div>
              </div>
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${STATUS_COLORS[viewOrder.status]}`}
              >
                {STATUS_LABELS[viewOrder.status]}
              </span>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-slate-600">
                <span className="font-medium">Mexanik:</span> {viewOrder.mechanic.name}{" "}
                {viewOrder.mechanic.surname}
              </div>
              {(viewOrder.customerName || viewOrder.customerPhone) && (
                <div className="bg-slate-50 rounded-lg px-4 py-3 space-y-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Müştəri</div>
                  {(viewOrder.customerName || viewOrder.customerSurname) && (
                    <div className="text-sm text-slate-700">
                      {[viewOrder.customerName, viewOrder.customerSurname].filter(Boolean).join(" ")}
                    </div>
                  )}
                  {viewOrder.customerPhone && (
                    <div className="text-sm text-slate-600">{viewOrder.customerPhone}</div>
                  )}
                </div>
              )}
              {viewOrder.status === "DONE" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">Ödəniş:</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PAYMENT_COLORS[viewOrder.paymentStatus] || PAYMENT_COLORS.PENDING}`}>
                    {PAYMENT_LABELS[viewOrder.paymentStatus] || PAYMENT_LABELS.PENDING}
                  </span>
                </div>
              )}
              {viewOrder.description && (
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Açıqlama:</span> {viewOrder.description}
                </div>
              )}

              {viewOrder.tasks.length > 0 && (
                <div>
                  <div className="font-medium text-slate-700 mb-2">Tapşırıqlar:</div>
                  <div className="space-y-1">
                    {viewOrder.tasks.map((t, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm py-2 px-3 bg-slate-50 rounded-lg"
                      >
                        <span className="text-slate-700">{t.description}</span>
                        <span className="font-medium text-slate-800">{t.price} ₼</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewOrder.products.length > 0 && (
                <div>
                  <div className="font-medium text-slate-700 mb-2">Məhsullar:</div>
                  <div className="space-y-1">
                    {viewOrder.products.map((p, i) => (
                      <div
                        key={i}
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

              <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-slate-800">
                <span>Cəmi:</span>
                <span>{calcTotal(viewOrder)} ₼</span>
              </div>
            </div>

            <button
              onClick={() => setViewOrder(null)}
              className="mt-6 w-full border border-slate-200 text-slate-700 rounded-lg py-2.5 font-medium hover:bg-slate-50 transition-colors"
            >
              Bağla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
