import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, ArrowRight, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateEvent, checkSlugAvailability } from "@/api/hooks/useEvents";
import { FormBuilder } from "@/components/form-builder/FormBuilder";
import type { FormField } from "@/types";
import { cn } from "@/lib/utils";

const eventSchema = z
  .object({
    titleAr: z.string().min(3, "العنوان بالعربي يجب أن يكون 3 أحرف على الأقل"),
    titleEn: z.string().min(3, "العنوان بالإنجليزي يجب أن يكون 3 أحرف على الأقل"),
    slug: z
      .string()
      .min(3, "الرابط المختصر مطلوب")
      .regex(
        /^[a-z0-9-]+$/,
        "الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط"
      ),
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

const steps = [
  { id: "basic", title: "البيانات الأساسية" },
  { id: "form", title: "نموذج التسجيل" },
  { id: "review", title: "المراجعة" },
];

const stepFields: Array<Array<keyof EventForm>> = [
  ["titleAr", "titleEn", "slug", "startDate", "endDate", "registrationDeadline"],
  [],
  [],
];

type SlugStatus = "idle" | "checking" | "available" | "taken";

export default function AdminEventCreatePage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formSchema, setFormSchema] = useState<FormField[]>([]);
  const [stepError, setStepError] = useState<string>("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const { mutate: createEvent, isPending } = useCreateEvent();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      registrationOpen: false,
      registrationAccess: "authenticated_only",
      guestEmailMode: "required",
      registrationDeadline: "",
    },
  });

  const watchedValues = watch();
  const slugValue = watch("slug");

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  useEffect(() => {
    if (slugTouched) return;
    const autoSlug = generateSlug(watchedValues.titleEn || "");
    setValue("slug", autoSlug, { shouldValidate: true });
  }, [watchedValues.titleEn, setValue, slugTouched]);

  useEffect(() => {
    if (!slugValue || slugValue.length < 3 || errors.slug) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");
    const timer = window.setTimeout(async () => {
      try {
        const available = await checkSlugAvailability(slugValue);
        setSlugStatus(available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [slugValue, errors.slug]);

  const slugStatusText = useMemo(() => {
    if (!slugValue || slugValue.length < 3) return "";
    if (slugStatus === "checking") return "جاري التحقق من توفر الرابط...";
    if (slugStatus === "available") return "الرابط المختصر متاح";
    if (slugStatus === "taken") return "هذا الرابط مستخدم مسبقاً";
    return "";
  }, [slugStatus, slugValue]);

  const onSubmit = (data: EventForm) => {
    const { venue, address, city, ...rest } = data;

    if (slugStatus === "taken") {
      setStepError("لا يمكن إنشاء المؤتمر لأن الرابط المختصر مستخدم مسبقاً");
      setCurrentStep(0);
      return;
    }

    createEvent(
      {
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
      {
        onSuccess: () => {
          navigate("/admin/events");
        },
      }
    );
  };

  const nextStep = async () => {
    setStepError("");

    if (currentStep === 0) {
      const isValid = await trigger(stepFields[0]);
      if (!isValid) {
        setStepError("يرجى تصحيح الأخطاء في البيانات الأساسية قبل المتابعة");
        return;
      }

      if (slugStatus === "taken") {
        setStepError("الرابط المختصر مستخدم مسبقاً. اختر رابطاً آخر");
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStepError("");
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">إضافة مؤتمر جديد</h1>
        <p className="text-muted-foreground">أدخل بيانات المؤتمر</p>
      </div>

      {!!stepError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{stepError}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 font-medium transition-colors",
                index < currentStep
                  ? "border-primary-600 bg-primary-600 text-white"
                  : index === currentStep
                  ? "border-primary-600 text-primary-600"
                  : "border-neutral-300 text-neutral-400"
              )}
            >
              {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
            </div>
            <span
              className={cn(
                "mr-2 hidden text-sm sm:block",
                index <= currentStep ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.title}
            </span>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-4 h-0.5 w-12 transition-colors",
                  index < currentStep ? "bg-primary-600" : "bg-neutral-200"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {currentStep === 0 && (
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
                  <p className="text-xs text-muted-foreground">
                    يُستخدم هذا العنوان لتوليد الرابط المختصر تلقائياً
                  </p>
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
                  placeholder="fifth-annual-conference"
                  {...register("slug")}
                  onChange={(event) => {
                    setSlugTouched(true);
                    const sanitized = generateSlug(event.target.value);
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
                  {errors.startDate && (
                    <p className="text-sm text-destructive">{errors.startDate.message}</p>
                  )}
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
                <p className="text-xs text-muted-foreground">
                  إذا لم تحدد موعداً، يبقى التسجيل متاحاً حتى بداية المؤتمر أو الإغلاق اليدوي
                </p>
                {errors.registrationDeadline && (
                  <p className="text-sm text-destructive">
                    {errors.registrationDeadline.message}
                  </p>
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
        )}

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>نموذج التسجيل</CardTitle>
            </CardHeader>
            <CardContent>
              <FormBuilder initialSchema={formSchema} onChange={setFormSchema} />
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>مراجعة البيانات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">العنوان (عربي)</p>
                  <p className="font-medium">{watchedValues.titleAr}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">العنوان (إنجليزي)</p>
                  <p className="font-medium">{watchedValues.titleEn}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">الرابط</p>
                <p className="font-mono text-sm">/events/{watchedValues.slug}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ البداية</p>
                  <p className="font-medium">{watchedValues.startDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ النهاية</p>
                  <p className="font-medium">{watchedValues.endDate}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">إغلاق التسجيل</p>
                <p className="font-medium">{watchedValues.registrationDeadline || "غير محدد"}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">صلاحية التسجيل</p>
                  <p className="font-medium">
                    {watchedValues.registrationAccess === "public"
                      ? "متاح للجميع"
                      : "فقط للمستخدمين المسجلين"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">بريد الضيف</p>
                  <p className="font-medium">
                    {watchedValues.registrationAccess === "public"
                      ? watchedValues.guestEmailMode === "required"
                        ? "إجباري"
                        : "اختياري"
                      : "غير مطبق"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">حقول نموذج التسجيل</p>
                <p className="font-medium">{formSchema.length} حقل</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}>
            <ArrowRight className="ml-2 h-4 w-4" />
            السابق
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={() => void nextStep()}>
              التالي
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isPending || slugStatus === "taken"}>
              {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إنشاء المؤتمر
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
