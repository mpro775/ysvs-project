import { useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Award,
  ArrowRight,
  XCircle,
  UserRound,
  Mic,
  CheckCircle2,
  MonitorPlay,
  Wifi,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventBySlug } from "@/api/hooks/useEvents";
import { useAuthStore } from "@/stores/authStore";
import { DynamicForm } from "@/components/dynamic-form/DynamicForm";
import { CountdownTimer } from "@/components/home/CountdownTimer";
import { EventLocationMap } from "@/components/events/EventLocationMap";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn, getEventDisplayStatus } from "@/lib/utils";

const toDayKey = (dateValue: string | Date) => new Date(dateValue).toISOString().slice(0, 10);

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { data: event, isLoading } = useEventBySlug(slug || "");
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState("about");
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const registrationDeadlinePassed = Boolean(
    event?.registrationDeadline &&
      new Date() > new Date(event.registrationDeadline)
  );
  const canRegister = Boolean(
    event &&
      getEventDisplayStatus(event) === "upcoming" &&
      event.registrationOpen &&
      !registrationDeadlinePassed
  );

  useEffect(() => {
    const hashValue = location.hash.replace("#", "");
    if (!hashValue) {
      return;
    }

    const validTabs = ["about", "speakers", "schedule"];
    if (canRegister) {
      validTabs.push("register");
    }

    if (validTabs.includes(hashValue) && hashValue !== activeTab) {
      setActiveTab(hashValue);
    }
  }, [location.hash, canRegister, activeTab]);

  useEffect(() => {
    if (!canRegister && activeTab === "register") {
      setActiveTab("about");
    }
  }, [canRegister, activeTab]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="mb-8 h-64 w-full" />
        <Skeleton className="mb-4 h-10 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">المؤتمر غير موجود</h1>
        <p className="mt-2 text-muted-foreground">
          لم يتم العثور على المؤتمر المطلوب
        </p>
        <Button asChild className="mt-4">
          <Link to="/events">العودة للمؤتمرات</Link>
        </Button>
      </div>
    );
  }

  const displayStatus = getEventDisplayStatus(event);
  const isUpcoming = displayStatus === "upcoming";
  const allowsGuestRegistration = event.registrationAccess === 'public';
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const eventDays = [...(event.eventDays || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const totalDays =
    eventDays.length ||
    Math.max(
      1,
      Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
  const totalProgramHours = eventDays.length
    ? Number(
        eventDays
          .reduce(
            (sum, day) =>
              sum +
              (new Date(day.endTime).getTime() - new Date(day.startTime).getTime()) /
                (1000 * 60 * 60),
            0
          )
          .toFixed(1)
      )
    : Math.max(
        1,
        Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))
      );
  const totalCmeHours = eventDays.length
    ? Number(eventDays.reduce((sum, day) => sum + (day.cmeHours || 0), 0).toFixed(2))
    : event.cmeHours;
  const registrationDeadlineLabel = event.registrationDeadline
    ? format(new Date(event.registrationDeadline), "d MMMM yyyy", { locale: ar })
    : "مفتوح حتى بداية المؤتمر";
  const attendeeLabel =
    event.maxAttendees > 0
      ? `${event.currentAttendees} / ${event.maxAttendees}`
      : `${event.currentAttendees}`;
  const eventMode = event.eventMode || (event.location ? "in_person" : "online");
  const isOnlineMode = eventMode === "online";
  const hasLiveStream = Boolean(event.hasLiveStream && event.liveStream);
  const streamInfo = event.liveStream;
  const hasStreamEmbedUrl = Boolean(streamInfo?.embedUrl);
  const hasStreamJoinUrl = Boolean(streamInfo?.joinUrl);
  const speakerById = new Map((event.speakers || []).map((speaker) => [speaker.id, speaker]));
  const sortedSchedule = [...(event.schedule || [])].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  const scheduleByDay = eventDays.map((day, index) => {
    const daySessionItems = sortedSchedule.filter((session) => {
      if (day.id && session.dayId) {
        return session.dayId === day.id;
      }

      return toDayKey(session.startTime) === toDayKey(day.date);
    });

    return {
      day,
      label: `اليوم ${index + 1}`,
      sessions: daySessionItems,
    };
  });
  const classifiedSessionIds = new Set(
    scheduleByDay.flatMap((group) => group.sessions.map((session) => session.id))
  );
  const legacyUnassignedSessions = sortedSchedule.filter(
    (session) => !classifiedSessionIds.has(session.id)
  );
  const sessionTypeLabels: Record<string, string> = {
    talk: "محاضرة علمية",
    panel: "جلسة نقاش",
    workshop: "ورشة عمل",
    break: "استراحة",
    networking: "جلسة تواصل",
    opening: "افتتاح",
    closing: "ختام",
  };
  const sessionTypeBadgeClasses: Record<string, string> = {
    talk: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-200",
    panel: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-200",
    workshop: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-200",
    break: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-200",
    networking:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-200",
    opening: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-200",
    closing: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-200",
  };
  const locationCoordinates = event.location?.coordinates;
  const hasLocationCoordinates =
    locationCoordinates &&
    Number.isFinite(locationCoordinates.lat) &&
    Number.isFinite(locationCoordinates.lng);
  const openStreetMapLink = hasLocationCoordinates
    ? `https://www.openstreetmap.org/?mlat=${locationCoordinates.lat}&mlon=${locationCoordinates.lng}#map=15/${locationCoordinates.lat}/${locationCoordinates.lng}`
    : undefined;
  const eventModeLabel = isOnlineMode ? "أونلاين" : "حضوري";

  const updateHashForTab = (tab: string) => {
    if (typeof window === "undefined") {
      return;
    }

    const nextHash = tab === "about" ? "" : `#${tab}`;
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(null, "", nextUrl);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    updateHashForTab(tab);
  };

  const handleRegisterCtaClick = () => {
    if (!canRegister) {
      return;
    }

    handleTabChange("register");
    tabsContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToSpeakerCard = (speakerId: string) => {
    setActiveTab("speakers");
    window.setTimeout(() => {
      const target = document.getElementById(`speaker-${speakerId}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
  };

  return (
    <div className="event-detail-theme min-h-screen pb-10">
      {/* Hero Section */}
      <div className="event-detail-hero relative overflow-hidden rounded-b-[2rem] text-white shadow-[var(--event-hero-shadow)]">
        <div className="pointer-events-none absolute -left-20 top-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-6 h-40 w-40 rounded-full bg-[#f8b4b4]/20 blur-3xl" />
        {event.coverImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${event.coverImage})` }}
          />
        )}
        <div className="container relative mx-auto px-4 py-10 md:py-14">
          <div className="rounded-3xl border border-white/20 bg-white/[0.07] p-5 backdrop-blur-sm md:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-white"
              >
                <ArrowRight className="h-4 w-4" />
                العودة للمؤتمرات
              </Link>

              <div className="flex flex-wrap gap-2">
                <Badge
                  className={cn(
                    "border-0 px-3 py-1 text-white",
                    isUpcoming
                      ? "bg-emerald-500/90"
                      : displayStatus === "ongoing"
                      ? "bg-rose-500/90"
                      : "bg-slate-600/85"
                  )}
                >
                  {displayStatus === "upcoming"
                    ? "قادم"
                    : displayStatus === "ongoing"
                    ? "جارٍ الآن"
                    : "منتهي"}
                </Badge>
                <Badge className="border border-white/20 bg-white/10 px-3 py-1 text-white">
                  {eventModeLabel}
                </Badge>
                {isUpcoming && !canRegister && (
                  <Badge className="border border-amber-300/70 bg-amber-400/20 px-3 py-1 text-amber-100">
                    انتهى موعد التسجيل
                  </Badge>
                )}
                {totalCmeHours > 0 && (
                  <Badge className="border-0 bg-[var(--event-accent)] px-3 py-1 text-white">
                    {totalCmeHours} ساعة CME
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_23rem] lg:items-start">
              <div>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
                  {event.titleAr}
                </h1>
                <p className="mt-2 text-base text-white/80 md:text-lg">{event.titleEn}</p>

                <div className="mt-5 flex flex-wrap gap-5 text-sm text-white/90">
                  <div className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-white/75" />
                    <span>
                      {format(startDate, "EEEE، d MMMM yyyy", {
                        locale: ar,
                      })}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 text-white/75" />
                    <span>
                      {format(startDate, "h:mm a", { locale: ar })} -{" "}
                      {format(endDate, "h:mm a", { locale: ar })}
                    </span>
                  </div>
                  {!isOnlineMode && event.location && (
                    <div className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-white/75" />
                      <span>{event.location.venue}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="event-hero-stat-card">
                  <Calendar className="mb-2 h-4 w-4 text-white/80" />
                  <p className="text-[11px] text-white/70">تاريخ المؤتمر</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {format(startDate, "d MMMM yyyy", { locale: ar })}
                  </p>
                </div>
                <div className="event-hero-stat-card">
                  <Clock className="mb-2 h-4 w-4 text-white/80" />
                  <p className="text-[11px] text-white/70">مدة الفعالية</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {totalDays} يوم / {totalProgramHours} ساعة
                  </p>
                </div>
                <div className="event-hero-stat-card">
                  <Users className="mb-2 h-4 w-4 text-white/80" />
                  <p className="text-[11px] text-white/70">عدد المسجلين</p>
                  <p className="mt-1 text-sm font-semibold text-white">{attendeeLabel}</p>
                </div>
                <div className="event-hero-stat-card">
                  {isOnlineMode ? (
                    <Wifi className="mb-2 h-4 w-4 text-white/80" />
                  ) : (
                    <MapPin className="mb-2 h-4 w-4 text-white/80" />
                  )}
                  <p className="text-[11px] text-white/70">
                    {isOnlineMode ? "نمط الحضور" : "آخر موعد للتسجيل"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {isOnlineMode ? "انضمام عن بُعد" : registrationDeadlineLabel}
                  </p>
                </div>
              </div>
            </div>

            {isUpcoming && (
              <div className="mt-7 rounded-2xl border border-white/20 bg-white/[0.06] p-4">
                <p className="mb-3 text-sm text-white/80">يبدأ خلال:</p>
                <CountdownTimer targetDate={startDate} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2" ref={tabsContainerRef}>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="w-full justify-start rounded-xl border border-[var(--event-border)] bg-[var(--event-surface-muted)] p-1">
                <TabsTrigger value="about">نبذة عن المؤتمر</TabsTrigger>
                <TabsTrigger value="speakers">المتحدثون</TabsTrigger>
                <TabsTrigger value="schedule">الجدول</TabsTrigger>
                {canRegister && (
                  <TabsTrigger value="register">التسجيل</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <div className="event-surface-card rounded-2xl p-6">
                  <div className="event-rich-content prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary-700 hover:prose-a:text-primary-600 dark:prose-invert dark:prose-a:text-primary-300 dark:hover:prose-a:text-primary-200">
                    {event.descriptionAr ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: event.descriptionAr }}
                      />
                    ) : (
                      <p className="text-muted-foreground">لا يوجد وصف متاح</p>
                    )}
                  </div>

                  <div className="mt-8 border-t border-[var(--event-border)] pt-6 text-right">
                    <h3 className="mb-4 flex w-full items-center justify-end gap-2 text-right text-lg font-bold">
                      <span>ماذا ستحصل عليه من المؤتمر</span>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </h3>
                    {event.outcomes?.length ? (
                      <ul className="space-y-3 text-right">
                        {event.outcomes.map((outcome, index) => (
                          <li
                            key={`${index}-${outcome}`}
                            className="flex flex-row-reverse items-start gap-2 text-right text-sm text-foreground"
                          >
                            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        لم تتم إضافة مخرجات المؤتمر حتى الآن.
                      </p>
                    )}
                  </div>

                  <div className="mt-8 grid gap-4 border-t border-[var(--event-border)] pt-6 md:grid-cols-2">
                    <div className="rounded-xl border p-4">
                      <h3 className="mb-3 text-right font-bold">أهداف المؤتمر</h3>
                      {event.objectives?.length ? (
                        <ul className="space-y-2 text-right text-sm">
                          {event.objectives.map((objective, index) => (
                            <li key={`${index}-${objective}`} className="flex flex-row-reverse items-start gap-2 text-right">
                              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary-500" />
                              <span>{objective}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">لم تتم إضافة أهداف المؤتمر حتى الآن.</p>
                      )}
                    </div>

                    <div className="rounded-xl border p-4">
                      <h3 className="mb-3 text-right font-bold">الفئة المستهدفة</h3>
                      {event.targetAudience?.length ? (
                        <ul className="space-y-2 text-right text-sm">
                          {event.targetAudience.map((audience, index) => (
                            <li key={`${index}-${audience}`} className="flex flex-row-reverse items-start gap-2 text-right">
                              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-amber-500" />
                              <span>{audience}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">لم تتم إضافة الفئة المستهدفة حتى الآن.</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="speakers" className="mt-6">
                <Card className="event-surface-card">
                  <CardContent className="pt-6">
                    {event.speakers?.length ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {event.speakers.map((speaker) => (
                          <div id={`speaker-${speaker.id}`} key={speaker.id} className="rounded-xl border p-4 text-right">
                            <div className="mb-3 flex flex-row-reverse items-center gap-3">
                              {(speaker.imageUrl || speaker.image) ? (
                                <img
                                  src={speaker.imageUrl || speaker.image}
                                  alt={speaker.nameAr}
                                  className="h-14 w-14 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                                  <UserRound className="h-6 w-6 text-primary-700 dark:text-primary-300" />
                                </div>
                              )}
                              <div className="text-right">
                                <p className="font-semibold">{speaker.nameAr}</p>
                                <p className="text-sm text-muted-foreground">{speaker.titleAr}</p>
                              </div>
                            </div>
                            {speaker.organizationAr && (
                              <p className="text-sm text-muted-foreground">{speaker.organizationAr}</p>
                            )}
                            {speaker.bioAr && (
                              <p className="mt-2 text-sm leading-relaxed">{speaker.bioAr}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed p-6 text-center">
                        <p className="font-medium">لا يوجد متحدثون مضافون حالياً</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          سيتم تحديث هذه القائمة عند إضافة المتحدثين من لوحة الإدارة.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schedule" className="mt-6">
                <Card className="event-surface-card">
                  <CardContent className="pt-6 text-right" dir="rtl">
                    {sortedSchedule.length ? (
                      <div className="space-y-6">
                        {scheduleByDay.map((group) => (
                          <div key={group.day.id || group.label} className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                              <p className="font-semibold">{group.label}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(group.day.date), "EEEE، d MMMM yyyy", { locale: ar })}
                              </p>
                            </div>

                            {group.sessions.length ? (
                              <div className="space-y-4">
                                {group.sessions.map((item) => {
                                  const sessionSpeakers = (item.speakerIds || [])
                                    .map((speakerId) => speakerById.get(speakerId))
                                    .filter(Boolean);

                                  return (
                                    <div key={item.id} className="rounded-xl border p-4 text-right" dir="rtl">
                                      <div className="flex flex-wrap items-start justify-between gap-2" dir="rtl">
                                        <div className="text-right">
                                          <p className="font-semibold">{item.titleAr}</p>
                                          <p className="mt-1 text-sm text-muted-foreground">
                                            {format(new Date(item.startTime), "EEEE، d MMMM yyyy", {
                                              locale: ar,
                                            })}
                                          </p>
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            "font-medium",
                                            sessionTypeBadgeClasses[item.sessionType] ||
                                              "border-primary-300 text-primary-700 dark:border-primary-800 dark:text-primary-200"
                                          )}
                                        >
                                          {sessionTypeLabels[item.sessionType] || item.sessionType}
                                        </Badge>
                                      </div>

                                      <div className="mt-3 flex flex-row-reverse items-center justify-end gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>
                                          {format(new Date(item.startTime), "h:mm a", { locale: ar })} -{" "}
                                          {format(new Date(item.endTime), "h:mm a", { locale: ar })}
                                        </span>
                                      </div>

                                      {item.descriptionAr && (
                                        <p className="mt-3 text-right text-sm leading-relaxed">{item.descriptionAr}</p>
                                      )}

                                      {sessionSpeakers.length > 0 && (
                                        <div className="mt-3 border-t pt-3">
                                          <p className="mb-2 flex flex-row-reverse items-center justify-end gap-2 text-xs font-semibold text-muted-foreground">
                                            <Mic className="h-3.5 w-3.5" />
                                            المتحدثون
                                          </p>
                                          <div className="flex flex-wrap justify-end gap-2">
                                            {sessionSpeakers.map((speaker) => (
                                              <button
                                                key={speaker!.id}
                                                type="button"
                                                className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 transition hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-200 dark:hover:bg-primary-900/45"
                                                onClick={() => goToSpeakerCard(speaker!.id)}
                                              >
                                                {speaker!.nameAr}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                لا توجد جلسات مضافة لهذا اليوم.
                              </div>
                            )}
                          </div>
                        ))}

                        {legacyUnassignedSessions.length > 0 && (
                          <div className="space-y-3">
                            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                              جلسات قديمة غير مصنفة حسب الأيام
                            </div>
                            <div className="space-y-4">
                              {legacyUnassignedSessions.map((item) => {
                                const sessionSpeakers = (item.speakerIds || [])
                                  .map((speakerId) => speakerById.get(speakerId))
                                  .filter(Boolean);

                                return (
                                  <div key={item.id} className="rounded-xl border p-4 text-right" dir="rtl">
                                    <div className="flex flex-wrap items-start justify-between gap-2" dir="rtl">
                                      <div className="text-right">
                                        <p className="font-semibold">{item.titleAr}</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                          {format(new Date(item.startTime), "EEEE، d MMMM yyyy", {
                                            locale: ar,
                                          })}
                                        </p>
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "font-medium",
                                          sessionTypeBadgeClasses[item.sessionType] ||
                                            "border-primary-300 text-primary-700 dark:border-primary-800 dark:text-primary-200"
                                        )}
                                      >
                                        {sessionTypeLabels[item.sessionType] || item.sessionType}
                                      </Badge>
                                    </div>

                                    <div className="mt-3 flex flex-row-reverse items-center justify-end gap-2 text-sm text-muted-foreground">
                                      <Clock className="h-4 w-4" />
                                      <span>
                                        {format(new Date(item.startTime), "h:mm a", { locale: ar })} -{" "}
                                        {format(new Date(item.endTime), "h:mm a", { locale: ar })}
                                      </span>
                                    </div>

                                    {item.descriptionAr && (
                                      <p className="mt-3 text-right text-sm leading-relaxed">{item.descriptionAr}</p>
                                    )}

                                    {sessionSpeakers.length > 0 && (
                                      <div className="mt-3 border-t pt-3">
                                        <p className="mb-2 flex flex-row-reverse items-center justify-end gap-2 text-xs font-semibold text-muted-foreground">
                                          <Mic className="h-3.5 w-3.5" />
                                          المتحدثون
                                        </p>
                                        <div className="flex flex-wrap justify-end gap-2">
                                          {sessionSpeakers.map((speaker) => (
                                            <button
                                              key={speaker!.id}
                                              type="button"
                                              className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 transition hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-200 dark:hover:bg-primary-900/45"
                                              onClick={() => goToSpeakerCard(speaker!.id)}
                                            >
                                              {speaker!.nameAr}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                            <Clock className="h-6 w-6 text-primary-600 dark:text-primary-300" />
                          </div>
                          <div>
                            <p className="font-medium">بداية المؤتمر</p>
                            <p className="text-muted-foreground">
                              {format(
                                new Date(event.startDate),
                                "EEEE، d MMMM yyyy - h:mm a",
                                {
                                  locale: ar,
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                            <Clock className="h-6 w-6 text-primary-600 dark:text-primary-300" />
                          </div>
                          <div>
                            <p className="font-medium">نهاية المؤتمر</p>
                            <p className="text-muted-foreground">
                              {format(
                                new Date(event.endDate),
                                "EEEE، d MMMM yyyy - h:mm a",
                                {
                                  locale: ar,
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                          لم يتم إضافة جدول تفصيلي للجلسات بعد.
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {canRegister && (
                <TabsContent value="register" className="mt-6">
                  {isAuthenticated || allowsGuestRegistration ? (
                    <Card className="event-surface-card">
                      <CardHeader>
                        <CardTitle>نموذج التسجيل</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <DynamicForm
                          eventId={event._id}
                          schema={event.formSchema}
                          isAuthenticated={isAuthenticated}
                          guestRegistrationEnabled={allowsGuestRegistration}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="event-surface-card">
                      <CardContent className="py-12 text-center">
                        <p className="mb-4 text-lg">
                          يجب تسجيل الدخول للتسجيل في المؤتمر
                        </p>
                        <div className="flex justify-center gap-4">
                          <Button asChild>
                            <Link to="/login">تسجيل الدخول</Link>
                          </Button>
                          <Button variant="outline" asChild>
                            <Link to="/register">إنشاء حساب</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card - مفتوح */}
            {canRegister && (
              <Card className="event-surface-card">
                <CardHeader>
                  <CardTitle>التسجيل في المؤتمر</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event.registrationDeadline && (
                    <p className="text-sm text-muted-foreground">
                      آخر موعد للتسجيل:{" "}
                      {format(
                        new Date(event.registrationDeadline),
                        "d MMMM yyyy",
                        {
                          locale: ar,
                        }
                      )}
                    </p>
                  )}
                  {event.maxAttendees > 0 && (
                    <div>
                      <div className="mb-2 flex justify-between text-sm">
                        <span>المقاعد المتاحة</span>
                        <span>
                          {event.maxAttendees - event.currentAttendees} متبقي
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div
                          className="h-full bg-primary-600"
                          style={{
                            width: `${
                              (event.currentAttendees / event.maxAttendees) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <Button className="w-full" type="button" onClick={handleRegisterCtaClick}>
                    سجل الآن
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* بطاقة: التسجيل مغلق أو انتهى موعده */}
            {isUpcoming && !canRegister && (
              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <XCircle className="h-5 w-5" />
                    التسجيل غير متاح
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {registrationDeadlinePassed && event.registrationDeadline ? (
                    <p className="text-sm text-amber-800/90 dark:text-amber-200/90">
                      انتهى موعد التسجيل في{" "}
                      {format(
                        new Date(event.registrationDeadline),
                        "d MMMM yyyy",
                        {
                          locale: ar,
                        }
                      )}
                      . لا يمكن تقديم تسجيل جديد.
                    </p>
                  ) : !event.registrationOpen ? (
                    <p className="text-sm text-amber-800/90 dark:text-amber-200/90">
                      التسجيل في هذا المؤتمر مغلق حالياً.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {/* CME Info */}
            {totalCmeHours > 0 && (
              <Card className="event-surface-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500 dark:text-amber-300" />
                    ساعات التعليم الطبي المستمر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-300">
                    {totalCmeHours} ساعة
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    سيتم إصدار شهادة CME للحاضرين بعد انتهاء المؤتمر
                  </p>
                </CardContent>
              </Card>
            )}

            {hasLiveStream && (
              <Card className="event-surface-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MonitorPlay className="h-5 w-5 text-rose-600 dark:text-rose-300" />
                    البث المباشر
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    هذا المؤتمر يدعم المتابعة عبر البث المباشر.
                  </div>

                  {streamInfo?.provider && (
                    <p className="text-sm text-muted-foreground">المنصة: {streamInfo.provider}</p>
                  )}

                  {streamInfo?.instructions && (
                    <p className="text-sm leading-relaxed">{streamInfo.instructions}</p>
                  )}

                  {hasStreamJoinUrl && (
                    <Button asChild className="w-full">
                      <a href={streamInfo?.joinUrl} target="_blank" rel="noreferrer">
                        <LinkIcon className="ml-2 h-4 w-4" />
                        انضم الآن
                      </a>
                    </Button>
                  )}

                  {streamInfo?.meetingId && (
                    <p className="text-xs text-muted-foreground">Meeting ID: {streamInfo.meetingId}</p>
                  )}
                  {streamInfo?.passcode && (
                    <p className="text-xs text-muted-foreground">Passcode: {streamInfo.passcode}</p>
                  )}

                  {streamInfo?.supportContact && (
                    <p className="text-xs text-muted-foreground">الدعم الفني: {streamInfo.supportContact}</p>
                  )}

                  {streamInfo?.recordingAvailable && streamInfo?.recordingUrl && (
                    <Button asChild variant="outline" className="w-full">
                      <a href={streamInfo.recordingUrl} target="_blank" rel="noreferrer">
                        مشاهدة التسجيل
                      </a>
                    </Button>
                  )}

                  {hasStreamEmbedUrl && (
                    <div className="overflow-hidden rounded-lg border">
                      <iframe
                        src={streamInfo?.embedUrl}
                        className="aspect-video w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="البث المباشر للمؤتمر"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isOnlineMode && !hasLiveStream && (
              <Card className="event-surface-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-primary-600 dark:text-primary-300" />
                    حضور أونلاين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    هذا مؤتمر أونلاين. سيتم نشر رابط الانضمام وتعليمات الدخول عند توفرها.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Location */}
            {!isOnlineMode && event.location && (
              <Card className="event-surface-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    موقع المؤتمر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{event.location.venue}</p>
                  <p className="text-muted-foreground">
                    {event.location.address}
                  </p>
                  <p className="text-muted-foreground">{event.location.city}</p>
                  {hasLocationCoordinates ? (
                    <div className="mt-4 space-y-3">
                      <EventLocationMap
                        lat={locationCoordinates.lat}
                        lng={locationCoordinates.lng}
                      />
                      {openStreetMapLink && (
                        <Button asChild variant="outline" className="w-full">
                          <a href={openStreetMapLink} target="_blank" rel="noreferrer">
                            فتح الموقع في الخرائط
                          </a>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                      لا توجد إحداثيات موقع متاحة لهذا المؤتمر.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
