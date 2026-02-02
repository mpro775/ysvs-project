import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateEvent } from "@/api/hooks/useEvents";
import { FormBuilder } from "@/components/form-builder/FormBuilder";
import type { FormField } from "@/types";
import { cn } from "@/lib/utils";

const eventSchema = z.object({
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
  venue: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  maxAttendees: z.number().min(0).optional(),
  cmeHours: z.number().min(0).optional(),
  registrationOpen: z.boolean(),
});

type EventForm = z.infer<typeof eventSchema>;

const steps = [
  { id: "basic", title: "البيانات الأساسية" },
  { id: "form", title: "نموذج التسجيل" },
  { id: "review", title: "المراجعة" },
];

export default function AdminEventCreatePage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formSchema, setFormSchema] = useState<FormField[]>([]);
  const { mutate: createEvent, isPending } = useCreateEvent();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      registrationOpen: false,
    },
  });

  const watchedValues = watch();

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  const onSubmit = (data: EventForm) => {
    createEvent(
      {
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
      {
        onSuccess: () => {
          navigate("/admin/events");
        },
      }
    );
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">إضافة مؤتمر جديد</h1>
        <p className="text-muted-foreground">أدخل بيانات المؤتمر</p>
      </div>

      {/* Stepper */}
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
                index <= currentStep
                  ? "text-foreground"
                  : "text-muted-foreground"
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
        {/* Step 1: Basic Info */}
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
                    onChange={(e) => {
                      register("titleAr").onChange(e);
                      if (!watchedValues.slug) {
                        setValue("slug", generateSlug(e.target.value));
                      }
                    }}
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
                  placeholder="fifth-annual-conference"
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
                  {errors.startDate && (
                    <p className="text-sm text-destructive">
                      {errors.startDate.message}
                    </p>
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
                    <p className="text-sm text-destructive">
                      {errors.endDate.message}
                    </p>
                  )}
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
        )}

        {/* Step 2: Form Builder */}
        {currentStep === 1 && (
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
        )}

        {/* Step 3: Review */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>مراجعة البيانات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    العنوان (عربي)
                  </p>
                  <p className="font-medium">{watchedValues.titleAr}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    العنوان (إنجليزي)
                  </p>
                  <p className="font-medium">{watchedValues.titleEn}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">الرابط</p>
                <p className="font-mono text-sm">
                  /events/{watchedValues.slug}
                </p>
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
                <p className="text-sm text-muted-foreground">
                  حقول نموذج التسجيل
                </p>
                <p className="font-medium">{formSchema.length} حقل</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            السابق
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={nextStep}>
              التالي
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إنشاء المؤتمر
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
