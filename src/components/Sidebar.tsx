"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const ownerNav: NavItem[] = [
  { href: "/owner/dashboard", label: "İdarə Paneli", icon: "📊" },
  { href: "/owner/orders", label: "Sifarişlər", icon: "📋" },
  { href: "/owner/mechanics", label: "Mexaniklər", icon: "👨‍🔧" },
  { href: "/owner/warehouse", label: "Anbar", icon: "📦" },
];

const mechanicNav: NavItem[] = [
  { href: "/mechanic/dashboard", label: "Sifarişlərim", icon: "🔧" },
];

export default function Sidebar({ role, userName }: { role: string; userName: string }) {
  const pathname = usePathname();
  const nav = role === "OWNER" ? ownerNav : mechanicNav;

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="text-2xl font-bold">🔧 AutoServis</div>
        <div className="text-slate-400 text-xs mt-1">İdarəetmə Sistemi</div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="text-sm text-slate-300 mb-1 px-2">{userName}</div>
        <div className="text-xs text-slate-500 px-2 mb-3">
          {role === "OWNER" ? "Sahibkar" : "Mexanik"}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          🚪 Çıxış
        </button>
      </div>
    </aside>
  );
}
