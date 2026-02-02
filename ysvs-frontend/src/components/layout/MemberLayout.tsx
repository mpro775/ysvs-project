import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, User, Calendar, Award, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const sidebarLinks = [
  { href: "/member", icon: LayoutDashboard, label: "لوحة التحكم", end: true },
  { href: "/member/events", icon: Calendar, label: "مؤتمراتي" },
  { href: "/member/certificates", icon: Award, label: "شهاداتي" },
  { href: "/member/profile", icon: User, label: "الملف الشخصي" },
];

function SidebarNav({ onLinkClick }: { onLinkClick?: () => void }) {
  return (
    <nav className="space-y-1">
      {sidebarLinks.map((link) => (
        <NavLink
          key={link.href}
          to={link.href}
          end={link.end}
          onClick={onLinkClick}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary-50 text-primary-700"
                : "text-neutral-600 hover:bg-neutral-100"
            )
          }
        >
          <link.icon className="h-5 w-5 shrink-0" />
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function MemberLayout() {
  const [memberSidebarOpen, setMemberSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container mx-auto flex flex-1 flex-col gap-6 px-4 py-4 sm:flex-row sm:py-8">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <nav className="sticky top-24 rounded-lg border bg-white p-4">
            <SidebarNav />
          </nav>
        </aside>

        {/* Mobile: زر فتح القائمة */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setMemberSidebarOpen(true)}
            aria-label="فتح قائمة التنقل"
          >
            <Menu className="h-5 w-5" />
            قائمة التنقل
          </Button>
        </div>

        {/* Mobile Sidebar Drawer */}
        <Sheet open={memberSidebarOpen} onOpenChange={setMemberSidebarOpen}>
          <SheetContent
            side="right"
            className="w-72 max-w-[85vw] sm:w-80 [&>button]:hidden"
          >
            <SheetTitle className="sr-only">قائمة تنقل حسابي</SheetTitle>
            <SheetDescription className="sr-only">
              روابط لوحة التحكم والملف الشخصي ومؤتمراتي وشهاداتي
            </SheetDescription>
            <div className="flex h-14 items-center justify-between border-b px-4">
              <span className="font-bold">حسابي</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMemberSidebarOpen(false)}
                aria-label="إغلاق القائمة"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="mt-4 rounded-lg border bg-muted/30 p-4">
              <SidebarNav onLinkClick={() => setMemberSidebarOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
