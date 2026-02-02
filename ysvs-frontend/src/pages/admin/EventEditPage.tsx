import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEvent, useUpdateEvent } from "@/api/hooks/useEvents";
import { FormBuilder } from "@/components/form-builder/FormBuilder";
import type { FormField } from "@/types";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const eventSchema = z.object({
  titleAr: z.string().min(3, "العنوان بالعربي يجب أن يكون 3 أحرف على الأقل"),
  titleEn: z.string().min(3, "العنوان بالإنجليزي يجب أن يكون 3 أحرف على الأقل"),
  slug: z.string().min(3, "الرابط المختصر مطلوب"),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
  venue: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  maxAttendees: z.number().min(0).optional(),
  cmeHours: z.number().min(0).optional(),
  registrationOpen: z.boolean(),
});

type EventForm = z.infer<typeof eventSchema>;

export default function AdminEventEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading } = useEvent(id || "");
  const { mutate: updateEvent, isPending } = useUpdateEvent();
  const [formSchema, setFormSchema] = useState<FormField[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
  });

  useEffect(() => {
    if (event) {
      reset({
        titleAr: event.titleAr,
        titleEn: event.titleEn,
        slug: event.slug,
        descriptionAr: event.descriptionAr || "",
        descriptionEn: event.descriptionEn || "",
        startDate: new Date(event.startDate).toISOString().slice(0, 16),
        endDate: new Date(event.endDate).toISOString().slice(0, 16),
        venue: event.location?.venue || "",
        address: event.location?.address || "",
        city: event.location?.city || "",
        maxAttendees: event.maxAttendees,
        cmeHours: event.cmeHours,
        registrationOpen: event.registrationOpen,
      });
      setFormSchema(event.formSchema || []);
    }
  }, [event, reset]);

  const watchedValues = watch();

  const onSubmit = (data: EventForm) => {
    if (!id) return;

    updateEvent(
      {
        id,
        data: {
          ...data,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          location: data.venue
            ? {
                venue: data.venue,
                address: data.address || "",
                city: data.city || "",
              }
            : undefined,
          formSchema,
        },
      },
      {
        onSuccess: () => {
          navigate("/admin/events");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">المؤتمر غير موجود</h1>
        <Button asChild className="mt-4">
          <Link to="/admin/events">العودة للمؤتمرات</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/events">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">تعديل المؤتمر</h1>
          <p className="text-muted-foreground">{event.titleAr}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="basic">
          <TabsList>
            <TabsTrigger value="basic">البيانات الأساسية</TabsTrigger>
            <TabsTrigger value="form">نموذج التسجيل</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>البيانات الأساسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="titleAr">العنوان (عربي) *</Label>
                    <Input
                      id="titleAr"
                      {...register("titleAr")}
                      className={errors.titleAr ? "border-destructive" : ""}
                    />
                    {errors.titleAr && (
                      <p className="text-sm text-destructive">
                        {errors.titleAr.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="titleEn">العنوان (إنجليزي) *</Label>
                    <Input
                      id="titleEn"
                      dir="ltr"
                      {...register("titleEn")}
                      className={errors.titleEn ? "border-destructive" : ""}
                    />
                    {errors.titleEn && (
                      <p className="text-sm text-destructive">
                        {errors.titleEn.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">الرابط المختصر *</Label>
                  <Input
                    id="slug"
                    dir="ltr"
                    {...register("slug")}
                    className={errors.slug ? "border-destructive" : ""}
                  />
                  {errors.slug && (
                    <p className="text-sm text-destructive">
                      {errors.slug.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">تاريخ البداية *</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      {...register("startDate")}
                      className={errors.startDate ? "border-destructive" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">تاريخ النهاية *</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      {...register("endDate")}
                      className={errors.endDate ? "border-destructive" : ""}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">الوصف (عربي)</Label>
                  <Textarea
                    id="descriptionAr"
                    rows={4}
                    {...register("descriptionAr")}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="venue">المكان</Label>
                    <Input id="venue" {...register("venue")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">العنوان</Label>
                    <Input id="address" {...register("address")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">المدينة</Label>
                    <Input id="city" {...register("city")} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxAttendees">الحد الأقصى للمسجلين</Label>
                    <Input
                      id="maxAttendees"
                      type="number"
                      min={0}
                      {...register("maxAttendees")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cmeHours">ساعات CME</Label>
                    <Input
                      id="cmeHours"
                      type="number"
                      min={0}
                      {...register("cmeHours")}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="registrationOpen"
                    checked={watchedValues.registrationOpen}
                    onCheckedChange={(checked) =>
                      setValue("registrationOpen", checked)
                    }
                  />
                  <Label htmlFor="registrationOpen">فتح التسجيل</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="form" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>نموذج التسجيل</CardTitle>
              </CardHeader>
              <CardContent>
                <FormBuilder
                  initialSchema={formSchema}
                  onChange={setFormSchema}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/events">إلغاء</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ التغييرات
          </Button>
        </div>
      </form>
    </div>
  );
}
