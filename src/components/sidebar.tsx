"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  CreditCard,
  AlertTriangle,
  History,
  TrendingDown,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/immeubles", label: "Immeubles", icon: Building2 },
  { href: "/logements", label: "Logements", icon: DoorOpen },
  { href: "/locataires", label: "Locataires", icon: Users },
  { href: "/paiements", label: "Paiements", icon: CreditCard },
  { href: "/retards", label: "Retards", icon: AlertTriangle },
  { href: "/depenses", label: "Dépenses", icon: TrendingDown },
  { href: "/historique", label: "Historique", icon: History },
  { href: "/rapports", label: "Rapports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <>
      <div className="flex items-center gap-2 px-4 py-5 border-b border-green-800">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
          N
        </div>
        <div>
          <p className="text-white font-bold text-sm">Néhémie</p>
          <p className="text-green-300 text-xs">Gestion Locative</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
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
      </nav>

      <div className="border-t border-green-800 px-4 py-3">
        <p className="text-green-300 text-xs truncate">{session?.user?.name}</p>
        <p className="text-green-400 text-xs">{(session?.user as { role?: string })?.role}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-2 flex items-center gap-2 text-green-200 hover:text-white text-xs transition-colors"
        >
          <LogOut className="w-3 h-3" />
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-green-700 text-white p-2 rounded-lg shadow"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-green-900 flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-green-900 min-h-screen fixed inset-y-0 left-0">
        <NavContent />
      </div>
    </>
  );
}
