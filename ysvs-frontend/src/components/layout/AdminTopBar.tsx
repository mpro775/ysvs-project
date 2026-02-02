import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, Moon, Sun, User, Home, Menu } from "lucide-react";
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

export function AdminTopBar() {
  const { user } = useAuthStore();
  const { theme, setTheme, setSidebarOpen } = useUIStore();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 min-h-14 shrink-0 items-center justify-between gap-2 border-b bg-white px-4 sm:px-6">
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

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            3
          </span>
        </Button>

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
