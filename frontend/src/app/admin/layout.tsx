
import type { ReactNode } from "react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({
  children,
}: AdminLayoutProps) {
  const session = await auth();

  // Vérifier l'authentification
  if (!session?.user) {
    redirect("/login");
  }

  // Vérifier les autorisations
  const role = (
    session.user as typeof session.user & {
      role?: string;
    }
  ).role;

  if (role !== "ADMIN") {
    // Rediriger chaque utilisateur vers son espace
    switch (role) {
      case "TEACHER":
        redirect("/teacher/dashboard");
      case "PARENT":
        redirect("/parent/dashboard");
      case "STUDENT":
        redirect("/student/dashboard");
      default:
        redirect("/");
    }
  }

  // Server Action pour la déconnexion
  async function logoutAction() {
    "use server";

    await signOut({
      redirectTo: "/",
    });
  }

  return (
    <div className="flex min-h-screen bg-[#08111f] text-white">

      {/* Navigation responsive */}
      <AdminSidebar
        userName={session.user.name ?? "Administrateur"}
        userEmail={session.user.email ?? ""}
        logoutAction={logoutAction}
      />

      {/* Contenu des pages administrateur */}
      <div className="min-w-0 flex-1 overflow-x-hidden">
        {children}
      </div>

    </div>
  );
}
