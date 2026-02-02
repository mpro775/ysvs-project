import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

export default function AdminLayout() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div
        className={cn(
          "flex w-full min-w-0 flex-1 flex-col transition-all duration-300",
          "mr-0",
          sidebarCollapsed ? "lg:mr-16" : "lg:mr-64"
        )}
      >
        <AdminTopBar />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
