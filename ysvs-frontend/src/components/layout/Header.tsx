import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
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
import { useLogout } from "@/api/hooks/useAuth";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const navLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/events", label: "المؤتمرات" },
  { href: "/news", label: "الأخبار" },
  { href: "/about", label: "عن الجمعية" },
  { href: "/contact", label: "تواصل معنا" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, isAdmin } = useAuthStore();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 text-white">
      {/* الشريط الرئيسي */}
      <div className="overflow-hidden rounded-b-2xl border-b border-primary-900/40 bg-gradient-to-l from-primary-900 via-primary-800 to-primary-700 shadow-sm dark:border-white/10 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary-950">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-3 sm:px-6">
          {/* RIGHT: logo only (لازم يكون أول عنصر في RTL) */}
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="شعار الجمعية اليمنية لجراحة الأوعية"
              className="h-11 w-auto object-contain"
            />
          </Link>

          {/* CENTER: links */}
            <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  cn(
                    "relative px-1 text-sm font-medium text-white/95 transition hover:text-white",
                    isActive && "text-white"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    <span
                      className={cn(
                        "absolute -bottom-2 left-0 right-0 h-[2px] rounded bg-white transition-opacity",
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* LEFT: Auth buttons + mobile menu (لازم يكون آخر عنصر) */}
            <div className="flex items-center gap-2">
              <ThemeToggle className="text-white hover:bg-white/10" />

              {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 w-9 rounded-full p-0 text-white hover:bg-white/10"
                  >
                    <Avatar className="h-9 w-9 border border-white/25">
                      <AvatarImage src={user?.avatar} alt={user?.fullNameAr} />
                      <AvatarFallback className="bg-white/15 text-white">
                        {user?.fullNameAr?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.fullNameAr} />
                      <AvatarFallback className="bg-primary-100 text-primary-700">
                        {user?.fullNameAr?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {user?.fullNameAr}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user?.email}
                      </span>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {isAdmin() && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        لوحة التحكم
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem asChild>
                    <Link to="/member" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      حسابي
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
            ) : (
                <div className="hidden items-center gap-2 sm:flex">
                {/* outlined */}
                <Link
                  to="/login"
                  className="rounded-full border border-white/60 bg-transparent px-4 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
                >
                  تسجيل الدخول
                </Link>
                {/* filled */}
                  <Link
                    to="/register"
                    className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-primary-900 transition hover:bg-white/90"
                  >
                  إنشاء حساب
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 lg:hidden"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>

        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/15 lg:hidden">
            <nav className="mx-auto max-w-[1400px] px-3 py-3 sm:px-6">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "rounded-md px-3 py-2 text-sm transition",
                        isActive
                          ? "bg-white/15 text-white"
                          : "text-white/90 hover:bg-white/10 hover:text-white",
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}

                {!isAuthenticated && (
                  <div className="mt-2 grid grid-cols-2 gap-2 pt-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-full border border-white/60 bg-transparent px-3 py-2 text-center text-sm font-medium text-white hover:bg-white/10"
                    >
                      تسجيل الدخول
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-full bg-white px-3 py-2 text-center text-sm font-semibold text-primary-900 hover:bg-white/90"
                    >
                      إنشاء حساب
                    </Link>
                  </div>
                )}

                <div className="mt-2 border-t border-white/15 pt-2">
                  <p className="mb-1 px-3 text-xs text-white/70">وضع العرض</p>
                  <div className="px-1">
                    <ThemeToggle
                      showLabel
                      className="w-full justify-center rounded-md text-white hover:bg-white/10"
                    />
                  </div>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
