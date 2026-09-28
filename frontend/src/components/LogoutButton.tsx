// frontend/src/components/LogoutButton.tsx
"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors bg-slate-900/60 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 px-4 py-2 rounded-xl"
    >
      <LogOut size={16} />
      <span>Déconnexion</span>
    </button>
  );
}