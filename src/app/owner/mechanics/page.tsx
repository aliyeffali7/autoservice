"use client";

import { useEffect, useState } from "react";

type Mechanic = {
  id: string;
  name: string;
  surname: string;
  phone: string;
  createdAt: string;
};

type FormData = {
  name: string;
  surname: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const emptyForm: FormData = { name: "", surname: "", phone: "", password: "", confirmPassword: "" };

export default function MechanicsPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMechanics();
  }, []);

  async function fetchMechanics() {
    const res = await fetch("/api/mechanics");
    const data = await res.json();
    setMechanics(data);
  }

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(m: Mechanic) {
    setEditId(m.id);
    setForm({ name: m.name, surname: m.surname, phone: m.phone, password: "", confirmPassword: "" });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!editId && form.password !== form.confirmPassword) {
      setError("Şifrələr uyğun gəlmir");
      return;
    }
    if (!editId && form.password.length < 4) {
      setError("Şifrə ən azı 4 simvol olmalıdır");
      return;
    }

    setLoading(true);
    try {
      const body: Partial<FormData> = { name: form.name, surname: form.surname, phone: form.phone };
      if (form.password) body.password = form.password;

      const res = await fetch(editId ? `/api/mechanics/${editId}` : "/api/mechanics", {
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
      fetchMechanics();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`${name} adlı mexaniki silmək istədiyinizə əminsiniz?`)) return;
    await fetch(`/api/mechanics/${id}`, { method: "DELETE" });
    fetchMechanics();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Mexaniklər</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          + Mexanik əlavə et
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {mechanics.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="text-5xl mb-3">👨‍🔧</div>
            Hələ mexanik əlavə edilməyib
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Ad Soyad</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Telefon</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Əlavə edilib</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mechanics.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {m.name} {m.surname}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{m.phone}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {new Date(m.createdAt).toLocaleDateString("az-AZ")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(m)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Redaktə
                      </button>
                      <button
                        onClick={() => handleDelete(m.id, `${m.name} ${m.surname}`)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              {editId ? "Mexaniki redaktə et" : "Yeni mexanik"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ad</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Soyad</label>
                  <input
                    value={form.surname}
                    onChange={(e) => setForm({ ...form, surname: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Şifrə {editId && <span className="text-slate-400">(boş buraxın - dəyişilməsin)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editId}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Şifrəni təsdiqlə</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required={!editId}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
