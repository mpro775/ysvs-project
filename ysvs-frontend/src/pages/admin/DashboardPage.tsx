import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  Award,
  Newspaper,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/api/hooks/useDashboard";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface StatCardProps {
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  href: string;
}

function StatCard({ title, value, change, icon, href }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <Link to={href}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4 pt-5 sm:pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground sm:text-sm">
                {title}
              </p>
              <p className="text-2xl font-bold sm:text-3xl">
                {value.toLocaleString("ar-EG")}
              </p>
              <div className="mt-1 flex items-center gap-1 text-sm">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-accent-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={cn(
                    isPositive ? "text-accent-600" : "text-destructive"
                  )}
                >
                  {isPositive ? "+" : ""}
                  {change}
                </span>
                <span className="text-muted-foreground">هذا الشهر</span>
              </div>
            </div>
            <div className="rounded-lg bg-primary-100 p-3 text-primary-600">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">لوحة التحكم</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          مرحباً بك في لوحة التحكم
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="المؤتمرات"
          value={stats?.eventsCount || 0}
          change={stats?.eventsChange || 0}
          icon={<Calendar className="h-6 w-6" />}
          href="/admin/events"
        />
        <StatCard
          title="الأعضاء"
          value={stats?.membersCount || 0}
          change={stats?.membersChange || 0}
          icon={<Users className="h-6 w-6" />}
          href="/admin/members"
        />
        <StatCard
          title="الشهادات"
          value={stats?.certificatesCount || 0}
          change={stats?.certificatesChange || 0}
          icon={<Award className="h-6 w-6" />}
          href="/admin/certificates"
        />
        <StatCard
          title="الأخبار"
          value={stats?.articlesCount || 0}
          change={stats?.articlesChange || 0}
          icon={<Newspaper className="h-6 w-6" />}
          href="/admin/articles"
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base sm:text-lg">
              المؤتمرات القادمة
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/events" className="flex items-center gap-1">
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.upcomingEvents?.length ? (
              <div className="space-y-4">
                {stats.upcomingEvents.slice(0, 5).map((event) => (
                  <Link
                    key={event._id}
                    to={`/admin/events/${event._id}/edit`}
                    className="flex flex-col gap-1 rounded-lg border p-3 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{event.titleAr}</p>
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        {format(new Date(event.startDate), "d MMMM yyyy", {
                          locale: ar,
                        })}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">
                        {event.currentAttendees} مسجل
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                لا توجد مؤتمرات قادمة
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">آخر النشاطات</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentActivities?.length ? (
              <div className="space-y-4">
                {stats.recentActivities.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-2 rounded-lg border p-2.5 sm:gap-3 sm:p-3"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        activity.type === "registration" &&
                          "bg-blue-100 text-blue-600",
                        activity.type === "certificate" &&
                          "bg-amber-100 text-amber-600",
                        activity.type === "article" &&
                          "bg-green-100 text-green-600",
                        activity.type === "member" &&
                          "bg-purple-100 text-purple-600"
                      )}
                    >
                      {activity.type === "registration" && (
                        <Calendar className="h-5 w-5" />
                      )}
                      {activity.type === "certificate" && (
                        <Award className="h-5 w-5" />
                      )}
                      {activity.type === "article" && (
                        <Newspaper className="h-5 w-5" />
                      )}
                      {activity.type === "member" && (
                        <Users className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.timestamp), "منذ p", {
                          locale: ar,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                لا توجد نشاطات حديثة
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
