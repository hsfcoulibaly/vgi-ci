"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, Building2, DoorOpen, Users, CreditCard,
  AlertTriangle, History, TrendingDown, FileText, LogOut,
  Menu, X, Settings, FolderOpen, Bell,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  RESPONSABLE: "Responsable",
  ASSISTANT: "Assistant",
};

const navItems = [
  { href: "/dashboard",   label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/immeubles",   label: "Immeubles",        icon: Building2 },
  { href: "/logements",   label: "Logements",        icon: DoorOpen },
  { href: "/locataires",  label: "Locataires",       icon: Users },
  { href: "/paiements",   label: "Paiements",        icon: CreditCard },
  { href: "/retards",     label: "Retards",           icon: AlertTriangle },
  { href: "/rappels",    label: "Rappels",           icon: Bell },
  { href: "/depenses",    label: "Dépenses",          icon: TrendingDown },
  { href: "/historique",  label: "Historique",        icon: History },
  { href: "/documents",   label: "Documents",         icon: FolderOpen },
  { href: "/rapports",    label: "Rapports",          icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const role = (session?.user as { role?: string })?.role ?? "";
  const isAdmin = role === "ADMIN";

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-green-800">
        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#15803d"/>
            <path d="M8 24V12l8-6 8 6v12" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            <rect x="13" y="17" width="6" height="7" rx="1" fill="white"/>
            <path d="M8 14h16" stroke="white" strokeWidth="1.5" strokeOpacity="0.4"/>
          </svg>
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Néhémie</p>
          <p className="text-green-300 text-xs">Gestion Locative</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              pathname.startsWith(href)
                ? "bg-green-700 text-white font-medium"
                : "text-green-100 hover:bg-green-800"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-green-500 text-xs uppercase tracking-wider font-medium">Administration</p>
            </div>
            <Link
              href="/parametres"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                pathname.startsWith("/parametres")
                  ? "bg-green-700 text-white font-medium"
                  : "text-green-100 hover:bg-green-800"
              )}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              Paramètres
            </Link>
          </>
        )}
      </nav>

      <div className="border-t border-green-800 px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {session?.user?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-green-100 text-xs font-medium truncate">{session?.user?.name}</p>
            <p className="text-green-400 text-xs">{ROLE_LABELS[role] ?? role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-green-300 hover:text-white text-xs transition-colors"
        >
          <LogOut className="w-3 h-3" />
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-green-700 text-white p-2 rounded-lg shadow"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
      )}

      <div className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-green-900 flex flex-col transition-transform duration-300",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <NavContent />
      </div>

      <div className="hidden lg:flex flex-col w-64 bg-green-900 min-h-screen fixed inset-y-0 left-0">
        <NavContent />
      </div>
    </>
  );
}
