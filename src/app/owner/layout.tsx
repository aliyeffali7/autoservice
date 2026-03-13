import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar role="OWNER" userName={session.user.name} />
      <main className="flex-1 bg-slate-50 overflow-auto">{children}</main>
    </div>
  );
}
