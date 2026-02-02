import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Award,
  Radio,
  Newspaper,
  Users,
  UserCog,
  Image,
  Settings,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const navItems = [
  {
    title: "الرئيسية",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "المؤتمرات",
    href: "/admin/events",
    icon: Calendar,
    children: [
      { title: "قائمة المؤتمرات", href: "/admin/events" },
      { title: "إضافة مؤتمر", href: "/admin/events/create" },
    ],
  },
  {
    title: "الشهادات",
    href: "/admin/certificates",
    icon: Award,
    children: [
      { title: "سجل الشهادات", href: "/admin/certificates" },
      { title: "إصدار شهادات", href: "/admin/certificates/issue" },
    ],
  },
  {
    title: "البث المباشر",
    href: "/admin/streaming",
    icon: Radio,
  },
  {
    title: "الأخبار",
    href: "/admin/articles",
    icon: Newspaper,
    children: [
      { title: "قائمة الأخبار", href: "/admin/articles" },
      { title: "إضافة خبر", href: "/admin/articles/create" },
    ],
  },
  {
    title: "الأعضاء",
    href: "/admin/members",
    icon: Users,
  },
  {
    title: "مجلس الإدارة",
    href: "/admin/board",
    icon: UserCog,
  },
  {
    title: "مكتبة الوسائط",
    href: "/admin/media",
    icon: Image,
  },
  {
    title: "الإعدادات",
    href: "/admin/settings",
    icon: Settings,
  },
];

function SidebarNavContent({
  sidebarCollapsed,
  onLinkClick,
}: {
  sidebarCollapsed: boolean;
  onLinkClick?: () => void;
}) {
  const location = useLocation();
  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="space-y-1 px-2">
      {navItems.map((item) => (
        <div key={item.href}>
          <NavLink
            to={item.href}
            end={item.href === "/admin"}
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-primary-800 text-white"
                : "text-primary-200 hover:bg-primary-800 hover:text-white"
            )}
            title={sidebarCollapsed ? item.title : undefined}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {(!sidebarCollapsed || onLinkClick) && <span>{item.title}</span>}
          </NavLink>
          {(!sidebarCollapsed || onLinkClick) &&
            item.children &&
            isActive(item.href) && (
              <div className="mr-8 mt-1 space-y-1">
                {item.children.map((child) => (
                  <NavLink
                    key={child.href}
                    to={child.href}
                    end
                    onClick={onLinkClick}
                    className={({ isActive: childActive }) =>
                      cn(
                        "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                        childActive
                          ? "bg-primary-700 text-white"
                          : "text-primary-300 hover:bg-primary-800 hover:text-white"
                      )
                    }
                  >
                    {child.title}
                  </NavLink>
                ))}
              </div>
            )}
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar() {
  const {
    sidebarCollapsed,
    toggleSidebarCollapse,
    sidebarOpen,
    setSidebarOpen,
  } = useUIStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-40 hidden h-screen flex-col border-l bg-primary-900 text-white transition-all duration-300 lg:flex",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-primary-800 px-4">
          {!sidebarCollapsed && <span className="font-bold">لوحة التحكم</span>}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-primary-800"
            onClick={toggleSidebarCollapse}
          >
            {sidebarCollapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        <ScrollArea className="flex-1 py-4">
          <SidebarNavContent sidebarCollapsed={sidebarCollapsed} />
        </ScrollArea>
        {!sidebarCollapsed && (
          <div className="border-t border-primary-800 p-4 text-center text-xs text-primary-400">
            YSVS Admin v1.0
          </div>
        )}
      </aside>

      {/* Mobile sidebar drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="right"
          className="w-72 max-w-[85vw] border-none bg-primary-900 p-0 text-white [&>button]:hidden"
        >
          <SheetTitle className="sr-only">قائمة تنقل لوحة التحكم</SheetTitle>
          <SheetDescription className="sr-only">
            قائمة الروابط للتنقل بين أقسام لوحة التحكم
          </SheetDescription>
          <div className="flex h-14 items-center justify-between border-b border-primary-800 px-4 sm:h-16">
            <span className="font-bold">لوحة التحكم</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-primary-800"
              onClick={() => setSidebarOpen(false)}
              aria-label="إغلاق القائمة"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="flex-1 py-4">
            <SidebarNavContent
              sidebarCollapsed={false}
              onLinkClick={() => setSidebarOpen(false)}
            />
          </ScrollArea>
          <div className="border-t border-primary-800 p-4 text-center text-xs text-primary-400">
            YSVS Admin v1.0
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
