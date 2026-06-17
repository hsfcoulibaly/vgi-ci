import { Sidebar } from "@/components/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
