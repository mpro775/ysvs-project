import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Award,
  ArrowRight,
  XCircle,
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
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { getEventDisplayStatus } from "@/lib/utils";

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = useEventBySlug(slug || "");
  const { isAuthenticated } = useAuthStore();

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
  const registrationDeadlinePassed =
    event.registrationDeadline &&
    new Date() > new Date(event.registrationDeadline);
  const canRegister =
    isUpcoming && event.registrationOpen && !registrationDeadlinePassed;

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-primary-900 text-white">
        {event.coverImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${event.coverImage})` }}
          />
        )}
        <div className="container relative mx-auto px-4 py-16">
          <Link
            to="/events"
            className="mb-4 inline-flex items-center gap-2 text-primary-200 hover:text-white"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للمؤتمرات
          </Link>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={
                isUpcoming
                  ? "default"
                  : displayStatus === "ongoing"
                  ? "destructive"
                  : "secondary"
              }
            >
              {displayStatus === "upcoming"
                ? "قادم"
                : displayStatus === "ongoing"
                ? "جارٍ الآن"
                : "منتهي"}
            </Badge>
            {isUpcoming && !canRegister && (
              <Badge
                variant="outline"
                className="border-amber-500 text-amber-700 dark:text-amber-400"
              >
                انتهى موعد التسجيل
              </Badge>
            )}
            {event.cmeHours > 0 && (
              <Badge className="bg-amber-500">{event.cmeHours} ساعة CME</Badge>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-bold lg:text-4xl">
            {event.titleAr}
          </h1>
          <p className="mt-2 text-lg text-primary-200">{event.titleEn}</p>

          {/* Event Info */}
          <div className="mt-6 flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-300" />
              <span>
                {format(new Date(event.startDate), "d MMMM yyyy", {
                  locale: ar,
                })}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-300" />
                <span>
                  {event.location.venue}، {event.location.city}
                </span>
              </div>
            )}
            {event.maxAttendees > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-300" />
                <span>
                  {event.currentAttendees} / {event.maxAttendees} مسجل
                </span>
              </div>
            )}
          </div>

          {/* Countdown */}
          {isUpcoming && (
            <div className="mt-8">
              <p className="mb-4 text-primary-200">يبدأ خلال:</p>
              <CountdownTimer targetDate={new Date(event.startDate)} />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="about">نبذة عن المؤتمر</TabsTrigger>
                <TabsTrigger value="schedule">الجدول</TabsTrigger>
                {canRegister && (
                  <TabsTrigger value="register">التسجيل</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <div className="prose prose-lg max-w-none">
                  {event.descriptionAr ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: event.descriptionAr }}
                    />
                  ) : (
                    <p className="text-muted-foreground">لا يوجد وصف متاح</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                          <Clock className="h-6 w-6 text-primary-600" />
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
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                          <Clock className="h-6 w-6 text-primary-600" />
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
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {canRegister && (
                <TabsContent value="register" className="mt-6">
                  {isAuthenticated ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>نموذج التسجيل</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <DynamicForm
                          eventId={event._id}
                          schema={event.formSchema}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
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
              <Card>
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
                      <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
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
                  <Button className="w-full" asChild>
                    <a href="#register">سجل الآن</a>
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
            {event.cmeHours > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    ساعات التعليم الطبي المستمر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary-600">
                    {event.cmeHours} ساعة
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    سيتم إصدار شهادة CME للحاضرين بعد انتهاء المؤتمر
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Location */}
            {event.location && (
              <Card>
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
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
