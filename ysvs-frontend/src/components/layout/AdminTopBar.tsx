import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, User, Home, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { useLogout } from "@/api/hooks/useAuth";
import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  useAdminNotifications,
  useMarkAdminNotificationAsRead,
  useMarkAllAdminNotificationsAsRead,
} from "@/api/hooks/useAdminNotifications";
import { useAdminNotificationsStore } from "@/stores/adminNotificationsStore";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export function AdminTopBar() {
  const { user } = useAuthStore();
  const { setSidebarOpen } = useUIStore();
  const { mutate: logout } = useLogout();
  const { unreadCount, items, isConnected } = useAdminNotificationsStore();
  const { mutate: markAsRead } = useMarkAdminNotificationAsRead();
  const { mutate: markAllAsRead } = useMarkAllAdminNotificationsAsRead();

  useAdminNotifications({ page: 1, limit: 25 });

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 min-h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="فتح القائمة"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1 overflow-x-auto">
          <Breadcrumbs pathname={location.pathname} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {/* Visit Site */}
        <Button variant="ghost" size="sm" asChild>
          <Link to="/" target="_blank" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">زيارة الموقع</span>
          </Link>
        </Button>

        <ThemeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="الإشعارات">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -left-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                  {Math.min(unreadCount, 99)}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80 p-0">
            <div className="border-b px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">الإشعارات</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                    isConnected
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {isConnected ? "متصل" : "منقطع"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  غير المقروءة: {unreadCount.toLocaleString("ar-EG")}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => markAllAsRead()}
                  disabled={unreadCount === 0}
                >
                  تعليم الكل كمقروء
                </Button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  لا توجد إشعارات حالياً
                </p>
              ) : (
                items.slice(0, 20).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex cursor-pointer flex-col items-start gap-1 rounded-none border-b px-3 py-2.5 text-right"
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                      if (notification.actionUrl) {
                        navigate(notification.actionUrl);
                      }
                    }}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-5">{notification.title}</p>
                      {!notification.isRead && (
                        <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </p>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.fullNameAr} />
                <AvatarFallback className="bg-primary-100 text-primary-700">
                  {user?.fullNameAr?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{user?.fullNameAr}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.role === "super_admin" ? "مدير عام" : "مشرف"}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/admin/settings" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                الملف الشخصي
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
