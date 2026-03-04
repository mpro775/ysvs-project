import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEvent, useUpdateEvent, checkSlugAvailability } from "@/api/hooks/useEvents";
import { FormBuilder } from "@/components/form-builder/FormBuilder";
import type { FormField } from "@/types";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

const eventSchema = z
  .object({
    titleAr: z.string().min(3, "العنوان بالعربي يجب أن يكون 3 أحرف على الأقل"),
    titleEn: z.string().min(3, "العنوان بالإنجليزي يجب أن يكون 3 أحرف على الأقل"),
    slug: z
      .string()
      .min(3, "الرابط المختصر مطلوب")
      .regex(/^[a-z0-9-]+$/, "الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط"),
    descriptionAr: z.string().optional(),
    descriptionEn: z.string().optional(),
    startDate: z.string().min(1, "تاريخ البداية مطلوب"),
    endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
    registrationDeadline: z.string().optional(),
    venue: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    maxAttendees: z.number().min(0).optional(),
    cmeHours: z.number().min(0).optional(),
    registrationOpen: z.boolean(),
    registrationAccess: z.enum(["authenticated_only", "public"]),
    guestEmailMode: z.enum(["required", "optional"]),
  })
  .refine((values) => new Date(values.endDate) >= new Date(values.startDate), {
    path: ["endDate"],
    message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
  })
  .refine(
    (values) => {
      if (!values.registrationDeadline) return true;
      return new Date(values.registrationDeadline) <= new Date(values.startDate);
    },
    {
      path: ["registrationDeadline"],
      message: "موعد إغلاق التسجيل يجب أن يكون قبل أو يساوي تاريخ بداية المؤتمر",
    }
  );

type EventForm = z.infer<typeof eventSchema>;
type SlugStatus = "idle" | "checking" | "available" | "taken";

export default function AdminEventEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading } = useEvent(id || "");
  const { mutate: updateEvent, isPending } = useUpdateEvent();
  const [formSchema, setFormSchema] = useState<FormField[]>([]);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [summaryError, setSummaryError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      registrationAccess: "authenticated_only",
      guestEmailMode: "required",
      registrationOpen: false,
    },
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
        registrationDeadline: event.registrationDeadline
          ? new Date(event.registrationDeadline).toISOString().slice(0, 16)
          : "",
        venue: event.location?.venue || "",
        address: event.location?.address || "",
        city: event.location?.city || "",
        maxAttendees: event.maxAttendees,
        cmeHours: event.cmeHours,
        registrationOpen: event.registrationOpen,
        registrationAccess: event.registrationAccess || "authenticated_only",
        guestEmailMode: event.guestEmailMode || "required",
      });
      setFormSchema(event.formSchema || []);
    }
  }, [event, reset]);

  const watchedValues = watch();
  const slugValue = watch("slug");

  useEffect(() => {
    if (!slugValue || slugValue.length < 3 || errors.slug || !id || !event) {
      setSlugStatus("idle");
      return;
    }

    if (slugValue === event.slug) {
      setSlugStatus("available");
      return;
    }

    setSlugStatus("checking");
    const timer = window.setTimeout(async () => {
      try {
        const available = await checkSlugAvailability(slugValue, id);
        setSlugStatus(available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [slugValue, errors.slug, id, event]);

  const slugStatusText = useMemo(() => {
    if (!slugValue || slugValue.length < 3) return "";
    if (slugStatus === "checking") return "جاري التحقق من توفر الرابط...";
    if (slugStatus === "available") return "الرابط المختصر متاح";
    if (slugStatus === "taken") return "هذا الرابط مستخدم مسبقاً";
    return "";
  }, [slugStatus, slugValue]);

  const onSubmit = (data: EventForm) => {
    if (!id) return;

    const { venue, address, city, ...rest } = data;

    if (slugStatus === "taken") {
      setSummaryError("لا يمكن حفظ التعديلات لأن الرابط المختصر مستخدم مسبقاً");
      return;
    }

    setSummaryError("");
    updateEvent(
      {
        id,
        data: {
          ...rest,
          startDate: new Date(rest.startDate),
          endDate: new Date(rest.endDate),
          registrationDeadline: rest.registrationDeadline
            ? new Date(rest.registrationDeadline)
            : undefined,
          location: venue
            ? {
                venue,
                address: address || "",
                city: city || "",
              }
            : undefined,
          formSchema,
          registrationAccess: rest.registrationAccess,
          guestEmailMode: rest.guestEmailMode,
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

      {!!summaryError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{summaryError}</span>
          </div>
        </div>
      )}

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
                      <p className="text-sm text-destructive">{errors.titleAr.message}</p>
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
                      <p className="text-sm text-destructive">{errors.titleEn.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">الرابط المختصر *</Label>
                  <Input
                    id="slug"
                    dir="ltr"
                    {...register("slug")}
                    onChange={(event) => {
                      const sanitized = event.target.value
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "")
                        .replace(/-+/g, "-")
                        .replace(/^-|-$/g, "");
                      setValue("slug", sanitized, { shouldValidate: true, shouldDirty: true });
                    }}
                    className={cn(
                      errors.slug || slugStatus === "taken" ? "border-destructive" : "",
                      slugStatus === "available" ? "border-green-600" : ""
                    )}
                  />
                  <p className="font-mono text-xs text-muted-foreground">
                    /events/{watchedValues.slug || "your-event-slug"}
                  </p>
                  {slugStatusText && (
                    <p
                      className={cn(
                        "text-xs",
                        slugStatus === "taken" ? "text-destructive" : "text-muted-foreground",
                        slugStatus === "available" ? "text-green-700" : ""
                      )}
                    >
                      {slugStatusText}
                    </p>
                  )}
                  {errors.slug && (
                    <p className="text-sm text-destructive">{errors.slug.message}</p>
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
                    {errors.endDate && (
                      <p className="text-sm text-destructive">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationDeadline">موعد إغلاق التسجيل</Label>
                  <Input
                    id="registrationDeadline"
                    type="datetime-local"
                    {...register("registrationDeadline")}
                    className={errors.registrationDeadline ? "border-destructive" : ""}
                  />
                  {errors.registrationDeadline && (
                    <p className="text-sm text-destructive">{errors.registrationDeadline.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">الوصف (عربي)</Label>
                  <Textarea id="descriptionAr" rows={4} {...register("descriptionAr")} />
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
                      {...register("maxAttendees", {
                        setValueAs: (value) => (value === "" ? undefined : Number(value)),
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cmeHours">ساعات CME</Label>
                    <Input
                      id="cmeHours"
                      type="number"
                      min={0}
                      {...register("cmeHours", {
                        setValueAs: (value) => (value === "" ? undefined : Number(value)),
                      })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="registrationOpen"
                    checked={watchedValues.registrationOpen}
                    onCheckedChange={(checked) =>
                      setValue("registrationOpen", checked, { shouldDirty: true })
                    }
                  />
                  <Label htmlFor="registrationOpen">فتح التسجيل</Label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="registrationAccess">صلاحية التسجيل</Label>
                    <Select
                      value={watchedValues.registrationAccess}
                      onValueChange={(value: "authenticated_only" | "public") =>
                        setValue("registrationAccess", value, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger id="registrationAccess">
                        <SelectValue placeholder="اختر صلاحية التسجيل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="authenticated_only">
                          فقط من لديهم حساب
                        </SelectItem>
                        <SelectItem value="public">متاح للجميع (بما فيهم الضيوف)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guestEmailMode">بريد الضيف</Label>
                    <Select
                      value={watchedValues.guestEmailMode}
                      onValueChange={(value: "required" | "optional") =>
                        setValue("guestEmailMode", value, { shouldDirty: true })
                      }
                      disabled={watchedValues.registrationAccess !== "public"}
                    >
                      <SelectTrigger id="guestEmailMode">
                        <SelectValue placeholder="اختر سياسة البريد" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="required">إجباري</SelectItem>
                        <SelectItem value="optional">اختياري</SelectItem>
                      </SelectContent>
                    </Select>
                    {watchedValues.registrationAccess !== "public" && (
                      <p className="text-xs text-muted-foreground">
                        يتاح هذا الخيار عند السماح بتسجيل الضيوف
                      </p>
                    )}
                  </div>
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
                <FormBuilder initialSchema={formSchema} onChange={setFormSchema} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/events">إلغاء</Link>
          </Button>
          <Button type="submit" disabled={isPending || slugStatus === "taken"}>
            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ التغييرات
          </Button>
        </div>
      </form>
    </div>
  );
}
