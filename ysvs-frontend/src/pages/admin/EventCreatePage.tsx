import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateEvent, checkSlugAvailability } from "@/api/hooks/useEvents";
import { FormBuilder } from "@/components/form-builder/FormBuilder";
import { EventCoverImageField } from "@/components/events/EventCoverImageField";
import { LocationMapPicker } from "@/components/events/LocationMapPicker";
import { SpeakerImageField } from "@/components/events/SpeakerImageField";
import { InlineLoader } from "@/components/shared/LoadingSpinner";
import type { FormField } from "@/types";
import { cn } from "@/lib/utils";

const sessionTypeOptions = [
  { value: "talk", label: "محاضرة علمية" },
  { value: "panel", label: "جلسة نقاش" },
  { value: "workshop", label: "ورشة عمل" },
  { value: "opening", label: "افتتاح" },
  { value: "closing", label: "ختام" },
  { value: "break", label: "استراحة" },
  { value: "networking", label: "جلسة تواصل" },
] as const;

const streamProviderOptions = [
  { value: "youtube", label: "YouTube" },
  { value: "vimeo", label: "Vimeo" },
  { value: "zoom", label: "Zoom" },
  { value: "custom", label: "منصة أخرى" },
] as const;

const createClientId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const toDateTimeLocalInputValue = (dateValue?: Date | string) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
};

const toDateInputValue = (dateValue?: Date | string) => toDateTimeLocalInputValue(dateValue).slice(0, 10);

const toDateTimeFromDayAndTime = (dateValue: string, timeValue: string) =>
  new Date(`${dateValue}T${timeValue}`);

const toDayKey = (dateValue: string | Date) => toDateInputValue(dateValue);

const formatDateTimePreview = (value: string) => {
  if (!value) return "-";
  return value.replace("T", " ");
};

const findFirstErrorMessage = (errorValue: unknown): string | undefined => {
  if (!errorValue || typeof errorValue !== "object") {
    return undefined;
  }

  if (
    "message" in errorValue &&
    typeof (errorValue as { message?: unknown }).message === "string" &&
    (errorValue as { message: string }).message.trim().length > 0
  ) {
    const directMessage = (errorValue as { message: string }).message;
    if (directMessage !== "Invalid input") {
      return directMessage;
    }
  }

  for (const nestedValue of Object.values(errorValue)) {
    const nestedMessage = findFirstErrorMessage(nestedValue);
    if (nestedMessage) {
      return nestedMessage;
    }
  }

  return undefined;
};

const optionalTextSchema = z.preprocess(
  (value) => (value === null || value === undefined ? undefined : value),
  z.string().optional()
);

const optionalUrlSchema = (message: string) =>
  z.preprocess(
    (value) => (value === null || value === undefined ? "" : value),
    z.string().url(message).optional().or(z.literal(""))
  );

const optionalNumberSchema = (min: number, message?: string) =>
  z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") {
        return undefined;
      }
      const parsed = typeof value === "number" ? value : Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    },
    message ? z.number().min(min, message).optional() : z.number().min(min).optional()
  );

const speakerSchema = z.object({
  id: z.string().min(1),
  nameAr: z.string().trim().min(2, "اسم المتحدث مطلوب"),
  nameEn: optionalTextSchema,
  titleAr: z.string().trim().min(2, "المسمى الوظيفي مطلوب"),
  titleEn: optionalTextSchema,
  organizationAr: optionalTextSchema,
  organizationEn: optionalTextSchema,
  bioAr: optionalTextSchema,
  bioEn: optionalTextSchema,
  imageMediaId: optionalTextSchema,
  imageUrl: optionalTextSchema,
});

const scheduleItemSchema = z
  .object({
    id: z.string().min(1),
    dayId: z.string().min(1, "اختر اليوم المرتبط بهذه الجلسة"),
    titleAr: z.string().trim().min(2, "عنوان الجلسة مطلوب"),
    titleEn: optionalTextSchema,
    descriptionAr: optionalTextSchema,
    descriptionEn: optionalTextSchema,
    startTime: z.string().min(1, "وقت بداية الجلسة مطلوب"),
    endTime: z.string().min(1, "وقت نهاية الجلسة مطلوب"),
    sessionType: z.enum(sessionTypeOptions.map((item) => item.value) as [
      (typeof sessionTypeOptions)[number]["value"],
      ...(typeof sessionTypeOptions)[number]["value"][],
    ]),
    speakerIds: z.array(z.string()),
  })
  .refine((value) => new Date(value.endTime) > new Date(value.startTime), {
    path: ["endTime"],
    message: "وقت نهاية الجلسة يجب أن يكون بعد وقت البداية",
  });

const liveStreamSchema = z.object({
  provider: z.enum(streamProviderOptions.map((item) => item.value) as [
    (typeof streamProviderOptions)[number]["value"],
    ...(typeof streamProviderOptions)[number]["value"][],
  ]),
  embedUrl: optionalUrlSchema("رابط تضمين البث غير صالح"),
  joinUrl: optionalUrlSchema("رابط الانضمام غير صالح"),
  meetingId: optionalTextSchema,
  passcode: optionalTextSchema,
  instructions: optionalTextSchema,
  supportContact: optionalTextSchema,
  joinWindowMinutes: optionalNumberSchema(0),
  recordingAvailable: z.boolean().optional(),
  recordingUrl: optionalUrlSchema("رابط إعادة البث غير صالح"),
});

const eventDaySchema = z
  .object({
    id: z.string().min(1),
    date: z.string().min(1, "تاريخ اليوم مطلوب"),
    startTime: z.string().min(1, "وقت بداية اليوم مطلوب"),
    endTime: z.string().min(1, "وقت نهاية اليوم مطلوب"),
    cmeHours: z.coerce.number().min(0, "ساعات CME اليومية لا يمكن أن تكون سالبة"),
  })
  .refine(
    (value) =>
      toDateTimeFromDayAndTime(value.date, value.endTime) >
      toDateTimeFromDayAndTime(value.date, value.startTime),
    {
      path: ["endTime"],
      message: "وقت نهاية اليوم يجب أن يكون بعد وقت البداية",
    }
  );

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
    descriptionAr: optionalTextSchema,
    descriptionEn: optionalTextSchema,
    coverImage: optionalUrlSchema("رابط الصورة غير صالح"),
    startDate: z.string().min(1, "تاريخ البداية مطلوب"),
    endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
    registrationDeadline: optionalTextSchema,
    eventMode: z.enum(["in_person", "online"]),
    hasLiveStream: z.boolean(),
    liveStream: liveStreamSchema,
    venue: optionalTextSchema,
    address: optionalTextSchema,
    city: optionalTextSchema,
    coordinatesLat: optionalNumberSchema(-90, "خط العرض يجب أن يكون بين -90 و 90").pipe(
      z.number().max(90, "خط العرض يجب أن يكون بين -90 و 90").optional()
    ),
    coordinatesLng: optionalNumberSchema(-180, "خط الطول يجب أن يكون بين -180 و 180").pipe(
      z.number().max(180, "خط الطول يجب أن يكون بين -180 و 180").optional()
    ),
    maxAttendees: optionalNumberSchema(0),
    cmeHours: optionalNumberSchema(0),
    registrationOpen: z.boolean(),
    registrationAccess: z.enum(["authenticated_only", "public"]),
    guestEmailMode: z.enum(["required", "optional"]),
    outcomes: z
      .array(z.string().trim().min(1, "لا يمكن حفظ نقطة فارغة"))
      .min(1, "أضف نقطة واحدة على الأقل في مخرجات المؤتمر"),
    objectives: z
      .array(z.string().trim().min(1, "لا يمكن حفظ هدف فارغ"))
      .min(1, "أضف هدفاً واحداً على الأقل"),
    targetAudience: z
      .array(z.string().trim().min(1, "لا يمكن حفظ فئة فارغة"))
      .min(1, "أضف فئة مستهدفة واحدة على الأقل"),
    eventDays: z.array(eventDaySchema).min(1, "أضف يوماً واحداً على الأقل"),
    speakers: z.array(speakerSchema),
    schedule: z.array(scheduleItemSchema),
  })
  .refine((values) => new Date(values.endDate) > new Date(values.startDate), {
    path: ["endDate"],
    message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
  })
  .refine(
    (values) => {
      const eventStart = new Date(values.startDate);
      if (Number.isNaN(eventStart.getTime())) return false;
      return eventStart.getTime() >= Date.now();
    },
    {
      path: ["startDate"],
      message: "لا يمكن إنشاء مؤتمر بتاريخ بداية في الماضي",
    }
  )
  .refine(
    (values) => {
      if (!values.registrationDeadline) return true;
      return new Date(values.registrationDeadline) <= new Date(values.startDate);
    },
    {
      path: ["registrationDeadline"],
      message: "موعد إغلاق التسجيل يجب أن يكون قبل أو يساوي تاريخ بداية المؤتمر",
    }
  )
  .superRefine((values, ctx) => {
    const uniqueDays = new Set<string>();
    values.eventDays.forEach((day, index) => {
      if (uniqueDays.has(day.date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["eventDays", index, "date"],
          message: "لا يمكن تكرار نفس اليوم",
        });
      }
      uniqueDays.add(day.date);
    });

    const eventStart = new Date(values.startDate);
    const eventEnd = new Date(values.endDate);
    const speakerIds = new Set(values.speakers.map((speaker) => speaker.id));
    const dayById = new Map(values.eventDays.map((day) => [day.id, day]));

    values.schedule.forEach((session, index) => {
      const sessionStart = new Date(session.startTime);
      const sessionEnd = new Date(session.endTime);
      const selectedDay = dayById.get(session.dayId);

      if (!selectedDay) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["schedule", index, "dayId"],
          message: "اليوم المحدد للجلسة غير موجود",
        });
      } else {
        const dayStart = toDateTimeFromDayAndTime(selectedDay.date, selectedDay.startTime);
        const dayEnd = toDateTimeFromDayAndTime(selectedDay.date, selectedDay.endTime);

        if (toDayKey(sessionStart) !== toDayKey(selectedDay.date)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["schedule", index, "startTime"],
            message: "تاريخ الجلسة يجب أن يطابق اليوم المحدد",
          });
        }

        if (sessionStart < dayStart || sessionEnd > dayEnd) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["schedule", index, "startTime"],
            message: "وقت الجلسة يجب أن يكون ضمن وقت اليوم المحدد",
          });
        }
      }

      if (sessionStart < eventStart || sessionEnd > eventEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["schedule", index, "startTime"],
          message: "يجب أن تكون الجلسة ضمن وقت بداية ونهاية المؤتمر",
        });
      }

      session.speakerIds.forEach((speakerId, speakerIndex) => {
        if (!speakerIds.has(speakerId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["schedule", index, "speakerIds", speakerIndex],
            message: "تم اختيار متحدث غير موجود في قائمة المتحدثين",
          });
        }
      });
    });

    const hasLocationData = Boolean(
      values.venue?.trim() ||
        values.address?.trim() ||
        values.city?.trim() ||
        values.coordinatesLat !== undefined ||
        values.coordinatesLng !== undefined
    );

    if (values.eventMode === "in_person") {
      if (!values.venue?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["venue"],
          message: "اسم مكان المؤتمر مطلوب",
        });
      }
      if (!values.address?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address"],
          message: "عنوان المؤتمر مطلوب",
        });
      }
      if (!values.city?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["city"],
          message: "مدينة المؤتمر مطلوبة",
        });
      }
      if (values.coordinatesLat === undefined || values.coordinatesLng === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["coordinatesLat"],
          message: "يرجى تحديد موقع المؤتمر على الخريطة",
        });
      }
    } else if (hasLocationData) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eventMode"],
        message: "الموقع غير مطلوب عند اختيار مؤتمر أونلاين",
      });
    }

    if (values.hasLiveStream) {
      const hasEmbed = Boolean(values.liveStream.embedUrl?.trim());
      const hasJoin = Boolean(values.liveStream.joinUrl?.trim());
      if (!hasEmbed && !hasJoin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["liveStream", "embedUrl"],
          message: "أدخل رابط بث مدمج أو رابط انضمام مباشر",
        });
      }

      if (values.liveStream.recordingUrl && !values.liveStream.recordingAvailable) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["liveStream", "recordingAvailable"],
          message: "فعّل خيار التسجيل أولاً قبل إدخال رابط إعادة البث",
        });
      }
    }
  });

type EventForm = z.infer<typeof eventSchema>;

const steps = [
  { id: "basic", title: "البيانات الأساسية" },
  { id: "form", title: "نموذج التسجيل" },
  { id: "review", title: "المراجعة" },
];

const stepFields: Array<Array<keyof EventForm>> = [
  [
    "titleAr",
    "titleEn",
    "slug",
    "startDate",
    "endDate",
    "registrationDeadline",
    "eventMode",
    "hasLiveStream",
    "liveStream",
    "coordinatesLat",
    "coordinatesLng",
    "outcomes",
    "objectives",
    "targetAudience",
    "eventDays",
    "speakers",
    "schedule",
  ],
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
  const [activeScheduleDayId, setActiveScheduleDayId] = useState("");
  const { mutate: createEvent, isPending } = useCreateEvent();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema) as Resolver<EventForm>,
    defaultValues: {
      coverImage: "",
      registrationOpen: false,
      eventMode: "in_person",
      hasLiveStream: false,
      liveStream: {
        provider: "youtube",
        embedUrl: "",
        joinUrl: "",
        meetingId: "",
        passcode: "",
        instructions: "",
        supportContact: "",
        joinWindowMinutes: undefined,
        recordingAvailable: false,
        recordingUrl: "",
      },
      registrationAccess: "authenticated_only",
      guestEmailMode: "required",
    registrationDeadline: "",
      cmeHours: 0,
      coordinatesLat: undefined,
      coordinatesLng: undefined,
      outcomes: [""],
      objectives: [""],
      targetAudience: [""],
      eventDays: [
        {
          id: createClientId("day"),
          date: toDateInputValue(new Date()),
          startTime: "09:00",
          endTime: "15:00",
          cmeHours: 0,
        },
      ],
      speakers: [],
      schedule: [],
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

  const outcomes = watchedValues.outcomes || [];
  const objectives = watchedValues.objectives || [];
  const targetAudience = watchedValues.targetAudience || [];
  const eventDays = watchedValues.eventDays || [];
  const speakers = watchedValues.speakers || [];
  const schedule = watchedValues.schedule || [];
  const liveStream = watchedValues.liveStream;

  const sortedEventDays = useMemo(
    () =>
      [...eventDays].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [eventDays]
  );

  useEffect(() => {
    if (!sortedEventDays.length) {
      setActiveScheduleDayId("");
      return;
    }

    const hasActiveDay = sortedEventDays.some((day) => day.id === activeScheduleDayId);
    if (!hasActiveDay) {
      setActiveScheduleDayId(sortedEventDays[0].id);
    }
  }, [sortedEventDays, activeScheduleDayId]);

  const derivedStartDate = useMemo(() => {
    const firstDay = sortedEventDays[0];
    if (!firstDay?.date || !firstDay?.startTime) return "";
    return toDateTimeLocalInputValue(toDateTimeFromDayAndTime(firstDay.date, firstDay.startTime));
  }, [sortedEventDays]);

  const derivedEndDate = useMemo(() => {
    const lastDay = sortedEventDays[sortedEventDays.length - 1];
    if (!lastDay?.date || !lastDay?.endTime) return "";
    return toDateTimeLocalInputValue(toDateTimeFromDayAndTime(lastDay.date, lastDay.endTime));
  }, [sortedEventDays]);

  const totalCmeHours = useMemo(
    () =>
      Number(
        sortedEventDays.reduce((sum, day) => sum + (Number(day.cmeHours) || 0), 0).toFixed(2)
      ),
    [sortedEventDays]
  );

  useEffect(() => {
    if (derivedStartDate && watchedValues.startDate !== derivedStartDate) {
      setValue("startDate", derivedStartDate, { shouldDirty: true, shouldValidate: true });
    }
    if (derivedEndDate && watchedValues.endDate !== derivedEndDate) {
      setValue("endDate", derivedEndDate, { shouldDirty: true, shouldValidate: true });
    }
    if ((watchedValues.cmeHours || 0) !== totalCmeHours) {
      setValue("cmeHours", totalCmeHours, { shouldDirty: true, shouldValidate: true });
    }
  }, [
    derivedStartDate,
    derivedEndDate,
    totalCmeHours,
    watchedValues.startDate,
    watchedValues.endDate,
    watchedValues.cmeHours,
    setValue,
  ]);

  const addOutcome = () => {
    setValue("outcomes", [...outcomes, ""], { shouldDirty: true, shouldValidate: true });
  };

  const updateOutcome = (index: number, value: string) => {
    const next = [...outcomes];
    next[index] = value;
    setValue("outcomes", next, { shouldDirty: true, shouldValidate: true });
  };

  const removeOutcome = (index: number) => {
    const next = outcomes.filter((_, currentIndex) => currentIndex !== index);
    setValue("outcomes", next.length ? next : [""], { shouldDirty: true, shouldValidate: true });
  };

  const addObjective = () => {
    setValue("objectives", [...objectives, ""], { shouldDirty: true, shouldValidate: true });
  };

  const updateObjective = (index: number, value: string) => {
    const next = [...objectives];
    next[index] = value;
    setValue("objectives", next, { shouldDirty: true, shouldValidate: true });
  };

  const removeObjective = (index: number) => {
    const next = objectives.filter((_, currentIndex) => currentIndex !== index);
    setValue("objectives", next.length ? next : [""], { shouldDirty: true, shouldValidate: true });
  };

  const addTargetAudience = () => {
    setValue("targetAudience", [...targetAudience, ""], { shouldDirty: true, shouldValidate: true });
  };

  const updateTargetAudience = (index: number, value: string) => {
    const next = [...targetAudience];
    next[index] = value;
    setValue("targetAudience", next, { shouldDirty: true, shouldValidate: true });
  };

  const removeTargetAudience = (index: number) => {
    const next = targetAudience.filter((_, currentIndex) => currentIndex !== index);
    setValue("targetAudience", next.length ? next : [""], { shouldDirty: true, shouldValidate: true });
  };

  const addEventDay = () => {
    setValue(
      "eventDays",
      [
        ...eventDays,
        {
          id: createClientId("day"),
          date: toDateInputValue(new Date()),
          startTime: "09:00",
          endTime: "15:00",
          cmeHours: 0,
        },
      ],
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const resolveSessionDayIdByDate = (sessionStartTime: string, fallbackDayId = "") => {
    const sessionDateKey = toDayKey(sessionStartTime);
    const matchedDay = eventDays.find((day) => toDayKey(day.date) === sessionDateKey);
    if (matchedDay?.id) {
      return matchedDay.id;
    }

    return fallbackDayId || eventDays[0]?.id || "";
  };

  const updateEventDayField = (
    index: number,
    key: keyof EventForm["eventDays"][number],
    value: string | number
  ) => {
    const next = [...eventDays];
    next[index] = { ...next[index], [key]: value };
    setValue("eventDays", next, { shouldDirty: true, shouldValidate: true });
  };

  const removeEventDay = (index: number) => {
    const removedDayId = eventDays[index]?.id;
    const next = eventDays.filter((_, currentIndex) => currentIndex !== index);
    if (!next.length) {
      return;
    }
    setValue("eventDays", next, { shouldDirty: true, shouldValidate: true });

    if (removedDayId) {
      const fallbackDayId = next[0]?.id || "";
      const nextSchedule = schedule.map((session) => ({
        ...session,
        dayId:
          session.dayId === removedDayId
            ? resolveSessionDayIdByDate(session.startTime, fallbackDayId)
            : session.dayId,
      }));
      setValue("schedule", nextSchedule, { shouldDirty: true, shouldValidate: true });
    }
  };

  const addSpeaker = () => {
    const next = [
      ...speakers,
      {
        id: createClientId("speaker"),
        nameAr: "",
        nameEn: "",
        titleAr: "",
        titleEn: "",
        organizationAr: "",
        organizationEn: "",
        bioAr: "",
        bioEn: "",
        imageMediaId: "",
        imageUrl: "",
      },
    ];
    setValue("speakers", next, { shouldDirty: true, shouldValidate: true });
  };

  const updateSpeakerField = (index: number, key: keyof EventForm["speakers"][number], value: string) => {
    const next = [...speakers];
    next[index] = { ...next[index], [key]: value };
    setValue("speakers", next, { shouldDirty: true, shouldValidate: true });
  };

  const updateSpeakerImage = (
    index: number,
    image?: { imageMediaId?: string; imageUrl?: string }
  ) => {
    const next = [...speakers];
    next[index] = {
      ...next[index],
      imageMediaId: image?.imageMediaId || "",
      imageUrl: image?.imageUrl || "",
    };
    setValue("speakers", next, { shouldDirty: true, shouldValidate: true });
  };

  const removeSpeaker = (index: number) => {
    const removedSpeakerId = speakers[index]?.id;
    const nextSpeakers = speakers.filter((_, currentIndex) => currentIndex !== index);
    setValue("speakers", nextSpeakers, { shouldDirty: true, shouldValidate: true });
    if (removedSpeakerId) {
      const nextSchedule = schedule.map((session) => ({
        ...session,
        speakerIds: (session.speakerIds || []).filter((speakerId) => speakerId !== removedSpeakerId),
      }));
      setValue("schedule", nextSchedule, { shouldDirty: true, shouldValidate: true });
    }
  };

  const addScheduleItem = (targetDayId?: string) => {
    const defaultDay =
      sortedEventDays.find((day) => day.id === targetDayId) ||
      sortedEventDays.find((day) => day.id === activeScheduleDayId) ||
      sortedEventDays[0];
    const defaultStart = defaultDay
      ? toDateTimeLocalInputValue(toDateTimeFromDayAndTime(defaultDay.date, defaultDay.startTime))
      : watchedValues.startDate || "";
    const defaultEnd = defaultDay
      ? toDateTimeLocalInputValue(toDateTimeFromDayAndTime(defaultDay.date, defaultDay.endTime))
      : watchedValues.startDate || "";

    const next = [
      ...schedule,
      {
        id: createClientId("session"),
        dayId: defaultDay?.id || "",
        titleAr: "",
        titleEn: "",
        descriptionAr: "",
        descriptionEn: "",
        startTime: defaultStart,
        endTime: defaultEnd,
        sessionType: "talk" as const,
        speakerIds: [],
      },
    ];
    setValue("schedule", next, { shouldDirty: true, shouldValidate: true });
  };

  const updateScheduleField = (
    index: number,
    key: keyof EventForm["schedule"][number],
    value: string | string[]
  ) => {
    const next = [...schedule];
    next[index] = { ...next[index], [key]: value };
    setValue("schedule", next, { shouldDirty: true, shouldValidate: true });
  };

  const removeScheduleItem = (index: number) => {
    const next = schedule.filter((_, currentIndex) => currentIndex !== index);
    setValue("schedule", next, { shouldDirty: true, shouldValidate: true });
  };

  const toggleSessionSpeaker = (sessionIndex: number, speakerId: string, checked: boolean) => {
    const session = schedule[sessionIndex];
    const currentSpeakerIds = session.speakerIds || [];
    const nextSpeakerIds = checked
      ? [...new Set([...currentSpeakerIds, speakerId])]
      : currentSpeakerIds.filter((id) => id !== speakerId);
    updateScheduleField(sessionIndex, "speakerIds", nextSpeakerIds);
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
    if (currentStep !== steps.length - 1) {
      setStepError("لا يمكن إنشاء المؤتمر قبل الوصول إلى خطوة المراجعة الأخيرة");
      return;
    }

    const {
      venue,
      address,
      city,
      coordinatesLat,
      coordinatesLng,
      eventMode,
      hasLiveStream,
      liveStream,
      eventDays,
      ...rest
    } = data;

    if (slugStatus === "taken") {
      setStepError("لا يمكن إنشاء المؤتمر لأن الرابط المختصر مستخدم مسبقاً");
      setCurrentStep(0);
      return;
    }

    const hasLocationData =
      eventMode === "in_person" &&
      Boolean(
        venue?.trim() ||
          address?.trim() ||
          city?.trim() ||
          coordinatesLat !== undefined ||
          coordinatesLng !== undefined
      );

    createEvent(
      {
        ...rest,
        coverImage: rest.coverImage || undefined,
        startDate: new Date(derivedStartDate || rest.startDate),
        endDate: new Date(derivedEndDate || rest.endDate),
        registrationDeadline: rest.registrationDeadline
          ? new Date(rest.registrationDeadline)
          : undefined,
        eventMode,
        hasLiveStream,
        liveStream: hasLiveStream
          ? {
              provider: liveStream.provider,
              embedUrl: liveStream.embedUrl || undefined,
              joinUrl: liveStream.joinUrl || undefined,
              meetingId: liveStream.meetingId || undefined,
              passcode: liveStream.passcode || undefined,
              instructions: liveStream.instructions || undefined,
              supportContact: liveStream.supportContact || undefined,
              joinWindowMinutes: liveStream.joinWindowMinutes,
              recordingAvailable: Boolean(liveStream.recordingAvailable),
              recordingUrl: liveStream.recordingUrl || undefined,
            }
          : undefined,
        location: hasLocationData
          ? {
              venue: venue || "",
              address: address || "",
              city: city || "",
              coordinates:
                coordinatesLat !== undefined && coordinatesLng !== undefined
                  ? {
                      lat: coordinatesLat,
                      lng: coordinatesLng,
                    }
                  : undefined,
            }
          : undefined,
        outcomes: rest.outcomes.map((item) => item.trim()).filter(Boolean),
        objectives: rest.objectives.map((item) => item.trim()).filter(Boolean),
        targetAudience: rest.targetAudience.map((item) => item.trim()).filter(Boolean),
        speakers: rest.speakers.map((speaker) => ({
          ...speaker,
          imageMediaId: speaker.imageMediaId || undefined,
          imageUrl: speaker.imageUrl || undefined,
        })),
        schedule: rest.schedule
          .map((session) => ({
            ...session,
            startTime: new Date(session.startTime),
            endTime: new Date(session.endTime),
          }))
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
        eventDays: eventDays
          .map((day) => ({
            id: day.id,
            date: new Date(day.date),
            startTime: toDateTimeFromDayAndTime(day.date, day.startTime),
            endTime: toDateTimeFromDayAndTime(day.date, day.endTime),
            cmeHours: Number(day.cmeHours) || 0,
          }))
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
        cmeHours: totalCmeHours,
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

  const onInvalid = (formErrors: FieldErrors<EventForm>) => {
    const firstError = findFirstErrorMessage(formErrors);
    setStepError(firstError ? `يرجى تصحيح الأخطاء قبل الإرسال: ${firstError}` : "يرجى تصحيح الأخطاء قبل الإرسال");
    setCurrentStep(0);
  };

  const nextStep = async () => {
    setStepError("");

    if (currentStep === 0) {
      const isValid = await trigger(stepFields[0]);
      if (!isValid) {
        setStepError("يرجى تصحيح أخطاء البيانات الأساسية والبرنامج قبل المتابعة");
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
        <p className="text-muted-foreground">أدخل بيانات المؤتمر والبرنامج العلمي الكامل</p>
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
                  : "border-border text-muted-foreground"
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
                  index < currentStep ? "bg-primary-600" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} dir="rtl" className="text-right">
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>البيانات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="titleAr">العنوان (عربي) *</Label>
                  <Input
                    id="titleAr"
                    {...register("titleAr")}
                    className={errors.titleAr ? "border-destructive" : ""}
                  />
                  {errors.titleAr && <p className="text-sm text-destructive">{errors.titleAr.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titleEn">العنوان (إنجليزي) *</Label>
                  <Input
                    id="titleEn"
                    dir="ltr"
                    {...register("titleEn")}
                    className={errors.titleEn ? "border-destructive" : ""}
                  />
                  <p className="text-xs text-muted-foreground">يُستخدم هذا العنوان لتوليد الرابط المختصر تلقائياً</p>
                  {errors.titleEn && <p className="text-sm text-destructive">{errors.titleEn.message}</p>}
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
                <p className="font-mono text-xs text-muted-foreground">/events/{watchedValues.slug || "your-event-slug"}</p>
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
                {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">تاريخ البداية *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    {...register("startDate")}
                    readOnly
                    disabled
                    className={errors.startDate ? "border-destructive" : ""}
                  />
                  <p className="text-xs text-muted-foreground">يُحتسب تلقائياً من أول يوم في جدول الأيام</p>
                  {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">تاريخ النهاية *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    {...register("endDate")}
                    readOnly
                    disabled
                    className={errors.endDate ? "border-destructive" : ""}
                  />
                  <p className="text-xs text-muted-foreground">يُحتسب تلقائياً من آخر يوم في جدول الأيام</p>
                  {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDeadline">موعد إغلاق التسجيل</Label>
                <Input
                  id="registrationDeadline"
                  type="datetime-local"
                  max={watchedValues.startDate || undefined}
                  {...register("registrationDeadline")}
                  className={errors.registrationDeadline ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  إذا لم تحدد موعداً، يبقى التسجيل متاحاً حتى بداية المؤتمر أو الإغلاق اليدوي
                </p>
                {errors.registrationDeadline && (
                  <p className="text-sm text-destructive">{errors.registrationDeadline.message}</p>
                )}
              </div>

              <div className="space-y-4 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">أيام المؤتمر والساعات اليومية</h3>
                    <p className="text-xs text-muted-foreground">
                      حدّد كل يوم مع وقت البداية والنهاية وساعات CME الخاصة به
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addEventDay}>
                    <Plus className="ml-1 h-4 w-4" />
                    إضافة يوم
                  </Button>
                </div>

                <div className="space-y-3">
                  {eventDays.map((day, index) => (
                    <div key={day.id} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium">اليوم {index + 1}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEventDay(index)}
                          disabled={eventDays.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="space-y-1">
                          <Label>التاريخ *</Label>
                          <Input
                            type="date"
                            value={day.date}
                            onChange={(event) => updateEventDayField(index, "date", event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>من *</Label>
                          <Input
                            type="time"
                            value={day.startTime}
                            onChange={(event) =>
                              updateEventDayField(index, "startTime", event.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>إلى *</Label>
                          <Input
                            type="time"
                            value={day.endTime}
                            onChange={(event) =>
                              updateEventDayField(index, "endTime", event.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>ساعات CME</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.5"
                            value={day.cmeHours}
                            onChange={(event) =>
                              updateEventDayField(
                                index,
                                "cmeHours",
                                event.target.value === "" ? 0 : Number(event.target.value)
                              )
                            }
                          />
                        </div>
                      </div>

                      {(errors.eventDays?.[index]?.date?.message ||
                        errors.eventDays?.[index]?.startTime?.message ||
                        errors.eventDays?.[index]?.endTime?.message ||
                        errors.eventDays?.[index]?.cmeHours?.message) && (
                        <p className="mt-2 text-sm text-destructive">
                          {errors.eventDays?.[index]?.date?.message ||
                            errors.eventDays?.[index]?.startTime?.message ||
                            errors.eventDays?.[index]?.endTime?.message ||
                            errors.eventDays?.[index]?.cmeHours?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {errors.eventDays?.message && (
                  <p className="text-sm text-destructive">{errors.eventDays.message}</p>
                )}

                <div className="grid gap-3 rounded-lg bg-muted/40 p-3 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">إجمالي الأيام</p>
                    <p className="font-semibold">{eventDays.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">بداية المؤتمر</p>
                    <p className="font-semibold">{formatDateTimePreview(derivedStartDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">إجمالي CME</p>
                    <p className="font-semibold">{totalCmeHours} ساعة</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="eventMode">نوع المؤتمر *</Label>
                  <Select
                    value={watchedValues.eventMode}
                    onValueChange={(value: "in_person" | "online") => {
                      setValue("eventMode", value, { shouldDirty: true, shouldValidate: true });
                      if (value === "online") {
                        setValue("venue", "", { shouldDirty: true, shouldValidate: true });
                        setValue("address", "", { shouldDirty: true, shouldValidate: true });
                        setValue("city", "", { shouldDirty: true, shouldValidate: true });
                        setValue("coordinatesLat", undefined, { shouldDirty: true, shouldValidate: true });
                        setValue("coordinatesLng", undefined, { shouldDirty: true, shouldValidate: true });
                      }
                    }}
                  >
                    <SelectTrigger id="eventMode">
                      <SelectValue placeholder="اختر نوع المؤتمر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">حضوري</SelectItem>
                      <SelectItem value="online">أونلاين</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.eventMode && <p className="text-sm text-destructive">{errors.eventMode.message}</p>}
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                  {watchedValues.eventMode === "in_person"
                    ? "المؤتمر حضوري: سيتم إظهار بيانات الموقع والخريطة وإلزامها."
                    : "المؤتمر أونلاين: سيتم إخفاء بيانات الموقع والتركيز على بيانات الانضمام والبث."}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionAr">الوصف (عربي)</Label>
                <Textarea id="descriptionAr" rows={4} {...register("descriptionAr")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionEn">الوصف (إنجليزي)</Label>
                <Textarea id="descriptionEn" dir="ltr" rows={4} {...register("descriptionEn")} />
              </div>

              <EventCoverImageField
                value={watchedValues.coverImage || undefined}
                onChange={(url) =>
                  setValue("coverImage", url || "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                disabled={isPending}
              />

              {watchedValues.eventMode === "in_person" ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="venue">المكان *</Label>
                      <Input id="venue" {...register("venue")} />
                      {errors.venue && <p className="text-sm text-destructive">{errors.venue.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">العنوان *</Label>
                      <Input id="address" {...register("address")} />
                      {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">المدينة *</Label>
                      <Input id="city" {...register("city")} />
                      {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
                    </div>
                  </div>

                  <LocationMapPicker
                    value={
                      watchedValues.coordinatesLat !== undefined && watchedValues.coordinatesLng !== undefined
                        ? {
                            lat: watchedValues.coordinatesLat,
                            lng: watchedValues.coordinatesLng,
                          }
                        : undefined
                    }
                    onChange={(coords) => {
                      setValue("coordinatesLat", Number(coords.lat.toFixed(6)), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue("coordinatesLng", Number(coords.lng.toFixed(6)), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  />
                  {(errors.coordinatesLat?.message || errors.coordinatesLng?.message) && (
                    <p className="text-sm text-destructive">
                      {errors.coordinatesLat?.message || errors.coordinatesLng?.message}
                    </p>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  تم اختيار مؤتمر أونلاين، لذلك تم إخفاء بيانات الموقع والخريطة.
                </div>
              )}

              <div className="space-y-4 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">البث المباشر المرتبط بالمؤتمر</h3>
                    <p className="text-xs text-muted-foreground">
                      يمكن تفعيله للحضوري أو الأونلاين حسب الحاجة.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="hasLiveStream"
                      checked={watchedValues.hasLiveStream}
                      onCheckedChange={(checked) =>
                        setValue("hasLiveStream", checked, { shouldDirty: true, shouldValidate: true })
                      }
                    />
                    <Label htmlFor="hasLiveStream">تفعيل البث</Label>
                  </div>
                </div>

                {watchedValues.hasLiveStream ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>مزود البث</Label>
                      <Select
                        value={liveStream.provider}
                        onValueChange={(value: "youtube" | "vimeo" | "zoom" | "custom") =>
                          setValue("liveStream.provider", value, { shouldDirty: true, shouldValidate: true })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر مزود البث" />
                        </SelectTrigger>
                        <SelectContent>
                          {streamProviderOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>رابط البث المدمج</Label>
                      <Input dir="ltr" placeholder="https://www.youtube.com/embed/..." {...register("liveStream.embedUrl")} />
                    </div>

                    <div className="space-y-2">
                      <Label>رابط الانضمام المباشر</Label>
                      <Input dir="ltr" placeholder="https://zoom.us/j/..." {...register("liveStream.joinUrl")} />
                    </div>

                    <div className="space-y-2">
                      <Label>معرف الاجتماع</Label>
                      <Input {...register("liveStream.meetingId")} />
                    </div>

                    <div className="space-y-2">
                      <Label>رمز الدخول</Label>
                      <Input {...register("liveStream.passcode")} />
                    </div>

                    <div className="space-y-2">
                      <Label>دعم فني</Label>
                      <Input placeholder="واتساب أو بريد الدعم" {...register("liveStream.supportContact")} />
                    </div>

                    <div className="space-y-2">
                      <Label>السماح بالدخول قبل البداية (دقائق)</Label>
                      <Input
                        type="number"
                        min={0}
                        {...register("liveStream.joinWindowMinutes", {
                          setValueAs: (value) => (value === "" ? undefined : Number(value)),
                        })}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        id="recordingAvailable"
                        checked={Boolean(liveStream.recordingAvailable)}
                        onCheckedChange={(checked) =>
                          setValue("liveStream.recordingAvailable", checked, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                      <Label htmlFor="recordingAvailable">إتاحة إعادة البث</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>رابط إعادة البث</Label>
                      <Input dir="ltr" placeholder="https://..." {...register("liveStream.recordingUrl")} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>تعليمات الانضمام</Label>
                      <Textarea rows={3} {...register("liveStream.instructions")} />
                    </div>

                    {(errors.liveStream?.embedUrl?.message ||
                      errors.liveStream?.joinUrl?.message ||
                      errors.liveStream?.recordingAvailable?.message ||
                      errors.liveStream?.recordingUrl?.message) && (
                      <p className="text-sm text-destructive md:col-span-2">
                        {errors.liveStream?.embedUrl?.message ||
                          errors.liveStream?.joinUrl?.message ||
                          errors.liveStream?.recordingAvailable?.message ||
                          errors.liveStream?.recordingUrl?.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">يمكنك تفعيل البث عند الحاجة فقط.</p>
                )}
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
                    value={totalCmeHours}
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">مجموع الساعات اليومية يُحسب تلقائياً</p>
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
                      <SelectItem value="authenticated_only">فقط من لديهم حساب</SelectItem>
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
                    <p className="text-xs text-muted-foreground">يتاح هذا الخيار عند السماح بتسجيل الضيوف</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">ماذا سيحصل عليه الحضور</h3>
                    <p className="text-xs text-muted-foreground">نقاط ثابتة تظهر في صفحة المؤتمر</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addOutcome}>
                    <Plus className="ml-1 h-4 w-4" />
                    إضافة نقطة
                  </Button>
                </div>
                <div className="space-y-3">
                  {outcomes.map((outcome, index) => (
                    <div key={`outcome-${index}`} className="flex items-start gap-2">
                      <Input
                        value={outcome}
                        onChange={(event) => updateOutcome(index, event.target.value)}
                        placeholder={`النقطة ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOutcome(index)}
                        disabled={outcomes.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {errors.outcomes?.message && (
                    <p className="text-sm text-destructive">{errors.outcomes.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">أهداف المؤتمر</h3>
                    <p className="text-xs text-muted-foreground">الأهداف العلمية والتنظيمية المتوقعة</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addObjective}>
                    <Plus className="ml-1 h-4 w-4" />
                    إضافة هدف
                  </Button>
                </div>
                <div className="space-y-3">
                  {objectives.map((objective, index) => (
                    <div key={`objective-${index}`} className="flex items-start gap-2">
                      <Input
                        value={objective}
                        onChange={(event) => updateObjective(index, event.target.value)}
                        placeholder={`الهدف ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeObjective(index)}
                        disabled={objectives.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {errors.objectives?.message && (
                    <p className="text-sm text-destructive">{errors.objectives.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">الفئة المستهدفة</h3>
                    <p className="text-xs text-muted-foreground">من هو الجمهور المقصود بالمؤتمر</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addTargetAudience}>
                    <Plus className="ml-1 h-4 w-4" />
                    إضافة فئة
                  </Button>
                </div>
                <div className="space-y-3">
                  {targetAudience.map((audience, index) => (
                    <div key={`audience-${index}`} className="flex items-start gap-2">
                      <Input
                        value={audience}
                        onChange={(event) => updateTargetAudience(index, event.target.value)}
                        placeholder={`الفئة ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTargetAudience(index)}
                        disabled={targetAudience.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {errors.targetAudience?.message && (
                    <p className="text-sm text-destructive">{errors.targetAudience.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">المتحدثون</h3>
                    <p className="text-xs text-muted-foreground">إضافة بيانات المتحدثين وربطهم بجلسات الجدول</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addSpeaker}>
                    <Plus className="ml-1 h-4 w-4" />
                    إضافة متحدث
                  </Button>
                </div>

                {!speakers.length && (
                  <p className="text-sm text-muted-foreground">لم تتم إضافة متحدثين بعد</p>
                )}

                <div className="space-y-4">
                  {speakers.map((speaker, index) => (
                    <div key={speaker.id} className="rounded-lg border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium">المتحدث {index + 1}</p>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSpeaker(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label>الاسم بالعربي *</Label>
                          <Input
                            value={speaker.nameAr}
                            onChange={(event) => updateSpeakerField(index, "nameAr", event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>المسمى الوظيفي *</Label>
                          <Input
                            value={speaker.titleAr}
                            onChange={(event) => updateSpeakerField(index, "titleAr", event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>الجهة</Label>
                          <Input
                            value={speaker.organizationAr || ""}
                            onChange={(event) =>
                              updateSpeakerField(index, "organizationAr", event.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>صورة المتحدث</Label>
                          <SpeakerImageField
                            value={{
                              imageMediaId: speaker.imageMediaId,
                              imageUrl: speaker.imageUrl,
                            }}
                            onChange={(image) => updateSpeakerImage(index, image)}
                          />
                        </div>
                      </div>

                      <div className="mt-3 space-y-1">
                        <Label>نبذة مختصرة</Label>
                        <Textarea
                          rows={3}
                          value={speaker.bioAr || ""}
                          onChange={(event) => updateSpeakerField(index, "bioAr", event.target.value)}
                        />
                      </div>

                      {(errors.speakers?.[index]?.nameAr?.message ||
                        errors.speakers?.[index]?.titleAr?.message ||
                        errors.speakers?.[index]?.imageUrl?.message) && (
                        <p className="mt-2 text-sm text-destructive">
                          {errors.speakers?.[index]?.nameAr?.message ||
                            errors.speakers?.[index]?.titleAr?.message ||
                            errors.speakers?.[index]?.imageUrl?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">الجدول الزمني</h3>
                    <p className="text-xs text-muted-foreground">يمكن إضافة الجلسة بدون متحدثين مؤقتاً وربطهم لاحقاً</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addScheduleItem(activeScheduleDayId)}
                  >
                    <Plus className="ml-1 h-4 w-4" />
                    إضافة جلسة
                  </Button>
                </div>

                {sortedEventDays.length ? (
                  <Tabs
                    dir="rtl"
                    value={activeScheduleDayId}
                    onValueChange={setActiveScheduleDayId}
                    className="space-y-4"
                  >
                    <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
                      {sortedEventDays.map((day, dayIndex) => (
                        <TabsTrigger
                          key={day.id}
                          value={day.id}
                          className="rounded-md border bg-background px-3 py-1.5 data-[state=active]:border-primary data-[state=active]:bg-primary/10"
                        >
                          {`اليوم ${dayIndex + 1}`}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {sortedEventDays.map((day, dayIndex) => {
                      const daySessions = schedule
                        .map((session, index) => ({ session, index }))
                        .filter((item) => item.session.dayId === day.id)
                        .sort(
                          (a, b) =>
                            new Date(a.session.startTime).getTime() - new Date(b.session.startTime).getTime()
                        );

                      return (
                        <TabsContent key={day.id} value={day.id} className="space-y-4">
                          <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                            {`جلسات اليوم ${dayIndex + 1} (${day.date})`}
                          </div>

                          {!daySessions.length && (
                            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                              لا توجد جلسات مضافة لهذا اليوم بعد.
                            </div>
                          )}

                          {daySessions.map(({ session, index }, sessionOrder) => (
                            <div key={session.id} className="rounded-lg border p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm font-medium">جلسة {sessionOrder + 1}</p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeScheduleItem(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-1 md:col-span-2">
                                  <Label>عنوان الجلسة *</Label>
                                  <Input
                                    value={session.titleAr}
                                    onChange={(event) => updateScheduleField(index, "titleAr", event.target.value)}
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label>نوع الجلسة *</Label>
                                  <Select
                                    value={session.sessionType}
                                    onValueChange={(value) => {
                                      const next = [...schedule];
                                      next[index] = {
                                        ...next[index],
                                        sessionType: value as EventForm["schedule"][number]["sessionType"],
                                      };
                                      setValue("schedule", next, { shouldDirty: true, shouldValidate: true });
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر نوع الجلسة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {sessionTypeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-1">
                                  <Label>اليوم</Label>
                                  <Input value={`اليوم ${dayIndex + 1} - ${day.date}`} readOnly disabled />
                                </div>

                                <div className="space-y-1">
                                  <Label>وصف مختصر</Label>
                                  <Input
                                    value={session.descriptionAr || ""}
                                    onChange={(event) =>
                                      updateScheduleField(index, "descriptionAr", event.target.value)
                                    }
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label>وقت البداية *</Label>
                                  <Input
                                    type="datetime-local"
                                    value={session.startTime}
                                    onChange={(event) =>
                                      updateScheduleField(index, "startTime", event.target.value)
                                    }
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label>وقت النهاية *</Label>
                                  <Input
                                    type="datetime-local"
                                    value={session.endTime}
                                    onChange={(event) =>
                                      updateScheduleField(index, "endTime", event.target.value)
                                    }
                                  />
                                </div>
                              </div>

                              <div className="mt-3 space-y-2 rounded-md bg-muted/40 p-3">
                                <p className="text-xs text-muted-foreground">المتحدثون اختياريون حالياً ويمكن إضافتهم لاحقاً</p>
                                {!speakers.length ? (
                                  <p className="text-sm text-amber-700">لا يوجد متحدثون بعد، ويمكن حفظ الجلسة بدون متحدثين</p>
                                ) : (
                                  <div className="grid gap-2 md:grid-cols-2">
                                    {speakers.map((speaker) => (
                                      <label key={`${session.id}-${speaker.id}`} className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                          checked={(session.speakerIds || []).includes(speaker.id)}
                                          onCheckedChange={(checked) =>
                                            toggleSessionSpeaker(index, speaker.id, checked === true)
                                          }
                                        />
                                        <span>{speaker.nameAr || "متحدث بدون اسم"}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {(errors.schedule?.[index]?.dayId?.message ||
                                errors.schedule?.[index]?.titleAr?.message ||
                                errors.schedule?.[index]?.startTime?.message ||
                                errors.schedule?.[index]?.endTime?.message ||
                                errors.schedule?.[index]?.speakerIds?.message) && (
                                <p className="mt-2 text-sm text-destructive">
                                  {errors.schedule?.[index]?.dayId?.message ||
                                    errors.schedule?.[index]?.titleAr?.message ||
                                    errors.schedule?.[index]?.startTime?.message ||
                                    errors.schedule?.[index]?.endTime?.message ||
                                    errors.schedule?.[index]?.speakerIds?.message}
                                </p>
                              )}
                            </div>
                          ))}

                          <div className="flex justify-end">
                            <Button type="button" variant="outline" size="sm" onClick={() => addScheduleItem(day.id)}>
                              <Plus className="ml-1 h-4 w-4" />
                              إضافة جلسة جديدة لهذا اليوم
                            </Button>
                          </div>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    أضف يوماً واحداً على الأقل أولاً، ثم أضف جلسات الجدول الزمني.
                  </div>
                )}
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
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                أضف هنا الحقول الإضافية الخاصة بهذا المؤتمر فقط. الحقول الأساسية
                (الاسم عربي/إنجليزي، البريد، الهاتف، الوصف الوظيفي، النوع، مكان العمل)
                تُدار تلقائياً من الحساب للعضو وتظهر للضيف بدون إضافتها هنا.
              </div>
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
                  <p className="font-medium">{formatDateTimePreview(watchedValues.startDate || "")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ النهاية</p>
                  <p className="font-medium">{formatDateTimePreview(watchedValues.endDate || "")}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">إغلاق التسجيل</p>
                <p className="font-medium">
                  {watchedValues.registrationDeadline
                    ? formatDateTimePreview(watchedValues.registrationDeadline)
                    : "غير محدد"}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">مخرجات المؤتمر</p>
                  <p className="font-medium">{outcomes.filter((item) => item.trim()).length} نقطة</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">أهداف المؤتمر</p>
                  <p className="font-medium">{objectives.filter((item) => item.trim()).length} هدف</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الفئة المستهدفة</p>
                  <p className="font-medium">{targetAudience.filter((item) => item.trim()).length} فئة</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">عدد المتحدثين</p>
                  <p className="font-medium">{speakers.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">عدد الجلسات</p>
                  <p className="font-medium">{schedule.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">عدد أيام المؤتمر</p>
                  <p className="font-medium">{eventDays.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي ساعات CME</p>
                  <p className="font-medium">{totalCmeHours} ساعة</p>
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
              {isPending && <InlineLoader className="ml-2" />}
              {isPending ? 'جاري إنشاء المؤتمر...' : 'إنشاء المؤتمر'}
            </Button>
          )}
        </div>
        {slugStatus === "taken" && currentStep === steps.length - 1 && (
          <p className="pt-3 text-sm text-destructive">لا يمكن الإنشاء لأن الرابط المختصر مستخدم مسبقاً.</p>
        )}
      </form>
    </div>
  );
}
