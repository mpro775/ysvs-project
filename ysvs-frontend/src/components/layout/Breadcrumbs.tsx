import { Link } from "react-router-dom";
import { ChevronLeft, Home } from "lucide-react";
import { Fragment } from "react";

interface BreadcrumbsProps {
  pathname: string;
}

const pathNames: Record<string, string> = {
  admin: "لوحة التحكم",
  events: "المؤتمرات",
  create: "إضافة",
  edit: "تعديل",
  registrants: "المسجلين",
  certificates: "الشهادات",
  issue: "إصدار",
  streaming: "البث المباشر",
  articles: "الأخبار",
  members: "الأعضاء",
  board: "مجلس الإدارة",
  media: "مكتبة الوسائط",
  settings: "الإعدادات",
};

export function Breadcrumbs({ pathname }: BreadcrumbsProps) {
  const segments = pathname.split("/").filter(Boolean);

  // Don't show breadcrumbs on main admin page
  if (segments.length <= 1) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
        <Home className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
        <span>الرئيسية</span>
      </div>
    );
  }

  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs sm:gap-1.5 sm:text-sm">
      <Link
        to="/admin"
        className="flex shrink-0 items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span>الرئيسية</span>
      </Link>

      {segments.slice(1).map((segment, index) => {
        // Skip IDs (MongoDB ObjectIds or UUIDs)
        if (segment.length === 24 || segment.includes("-")) {
          return null;
        }

        const path = "/" + segments.slice(0, index + 2).join("/");
        const isLast = index === segments.length - 2;
        const label = pathNames[segment] || segment;

        return (
          <Fragment key={path}>
            <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link
                to={path}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
