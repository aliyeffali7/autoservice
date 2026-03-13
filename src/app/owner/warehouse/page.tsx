"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  sellPrice: number;
  lowStockThreshold: number;
  createdAt: string;
};

type FormData = {
  name: string;
  quantity: string;
  purchasePrice: string;
  sellPrice: string;
  lowStockThreshold: string;
};

const emptyForm: FormData = {
  name: "",
  quantity: "0",
  purchasePrice: "",
  sellPrice: "",
  lowStockThreshold: "5",
};

export default function WarehousePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const res = await fetch("/api/warehouse");
    const data = await res.json();
    setProducts(data);
  }

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditId(p.id);
    setForm({
      name: p.name,
      quantity: String(p.quantity),
      purchasePrice: String(p.purchasePrice),
      sellPrice: String(p.sellPrice),
      lowStockThreshold: String(p.lowStockThreshold),
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = {
        name: form.name,
        quantity: Number(form.quantity),
        purchasePrice: Number(form.purchasePrice),
        sellPrice: Number(form.sellPrice),
        lowStockThreshold: Number(form.lowStockThreshold),
      };

      const res = await fetch(editId ? `/api/warehouse/${editId}` : "/api/warehouse", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Xəta baş verdi");
        return;
      }

      setShowModal(false);
      fetchProducts();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" məhsulunu silmək istədiyinizə əminsiniz?`)) return;
    await fetch(`/api/warehouse/${id}`, { method: "DELETE" });
    fetchProducts();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Anbar</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          + Məhsul əlavə et
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="text-5xl mb-3">📦</div>
            Anbar boşdur
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Məhsul</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Miqdar</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Alış Qiymeti</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Satış Qiymeti</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Min. Stok</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const isLow = p.quantity <= p.lowStockThreshold;
                return (
                  <tr key={p.id} className={`hover:bg-slate-50 ${isLow ? "bg-amber-50" : ""}`}>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {p.name}
                      {isLow && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          Az stok
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${isLow ? "text-amber-600" : "text-slate-700"}`}
                      >
                        {p.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{p.purchasePrice.toFixed(2)} ₼</td>
                    <td className="px-6 py-4 text-slate-600">{p.sellPrice.toFixed(2)} ₼</td>
                    <td className="px-6 py-4 text-slate-500">{p.lowStockThreshold}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Redaktə
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              {editId ? "Məhsulu redaktə et" : "Yeni məhsul"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Məhsul adı</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Miqdar</label>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min. Stok</label>
                  <input
                    type="number"
                    min="0"
                    value={form.lowStockThreshold}
                    onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Alış Qiymeti (₼)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.purchasePrice}
                    onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Satış Qiymeti (₼)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sellPrice}
                    onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                  {loading ? "Saxlanır..." : "Saxla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
