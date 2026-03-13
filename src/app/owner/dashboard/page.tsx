"use client";

import { useEffect, useState } from "react";

type DashboardData = {
  totalOrders: number;
  notStarted: number;
  inProgress: number;
  done: number;
  mechanics: number;
  revenue: number;
  lowStock: { id: string; name: string; quantity: number; lowStockThreshold: number }[];
};

export default function OwnerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-slate-500">Yüklənir...</div>
      </div>
    );
  }

  const stats = [
    { label: "Ümumi Sifarişlər", value: data.totalOrders, icon: "📋", color: "bg-blue-500" },
    { label: "Başlanmayıb", value: data.notStarted, icon: "⏳", color: "bg-slate-500" },
    { label: "İşlənir", value: data.inProgress, icon: "🔧", color: "bg-yellow-500" },
    { label: "Tamamlandı", value: data.done, icon: "✅", color: "bg-green-500" },
    { label: "Mexaniklər", value: data.mechanics, icon: "👨‍🔧", color: "bg-purple-500" },
    {
      label: "Gəlir (AZN)",
      value: data.revenue.toFixed(2),
      icon: "💰",
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">İdarə Paneli</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
            <div className={`${stat.color} text-white rounded-xl w-12 h-12 flex items-center justify-center text-2xl`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {data.lowStock.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span>⚠️</span> Az Stok Xəbərdarlığı
          </h2>
          <div className="space-y-3">
            {data.lowStock.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between py-3 px-4 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <span className="font-medium text-slate-700">{product.name}</span>
                <span className="text-amber-700 font-semibold text-sm">
                  {product.quantity} ədəd (min: {product.lowStockThreshold})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.lowStock.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-green-700 text-center">
          ✅ Bütün məhsullar normal stok səviyyəsindədir
        </div>
      )}
    </div>
  );
}
