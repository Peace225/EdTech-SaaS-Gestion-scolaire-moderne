// frontend/src/app/(admin)/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Si l'utilisateur n'est pas connecté ou n'est pas ADMIN, on le redirige vers / ou /login
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DashboardHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}