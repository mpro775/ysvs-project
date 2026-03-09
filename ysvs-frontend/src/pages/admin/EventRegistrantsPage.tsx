import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, Download, Check, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useEvent,
  useEventRegistrations,
  useMarkAttendance,
} from "@/api/hooks/useEvents";
import { EmptyState } from "@/components/shared/EmptyState";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import * as XLSX from "xlsx";
import type { FormField, Registration, UploadedFormFile, User } from "@/types";

const OTHER_OPTION_VALUE = "__other__";
const getOtherFieldId = (fieldId: string) => `${fieldId}__other`;

export default function AdminEventRegistrantsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading: loadingEvent } = useEvent(id || "");
  const { data: registrations, isLoading: loadingRegistrations } =
    useEventRegistrations(id || "");
  const { mutate: markAttendance, isPending } = useMarkAttendance();
  const [detailsRegistration, setDetailsRegistration] = useState<Registration | null>(null);

  const formatPrimitiveValue = (value: unknown): string => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    if (typeof value === "boolean") {
      return value ? "نعم" : "لا";
    }

    if (Array.isArray(value)) {
      return value.length ? value.map((item) => String(item).replace(/_/g, " ")).join("، ") : "-";
    }

    if (typeof value === "string") {
      return value.replace(/_/g, " ");
    }

    return String(value);
  };

  const getUploadedFile = (value: unknown): UploadedFormFile | null => {
    if (typeof value !== "object" || value === null) {
      return null;
    }

    const maybeFile = value as Partial<UploadedFormFile>;
    if (typeof maybeFile.url === "string" && typeof maybeFile.originalName === "string") {
      return maybeFile as UploadedFormFile;
    }

    return null;
  };

  const resolveOptionLabel = (field: FormField, value: unknown): string => {
    const stringValue = String(value || "");
    const matchedOption = field.options?.find((option) => option.value === stringValue);
    return matchedOption?.label || stringValue.replace(/_/g, " ");
  };

  const getFieldDisplay = (field: FormField, formData: Record<string, unknown>) => {
    const rawValue = formData[field.id];

    if ((field.type === "select" || field.type === "radio") && field.allowOther) {
      if (rawValue === OTHER_OPTION_VALUE) {
        return {
          text: formatPrimitiveValue(formData[getOtherFieldId(field.id)]),
          file: null,
        };
      }

      return { text: resolveOptionLabel(field, rawValue), file: null };
    }

    if (field.type === "multiselect" && Array.isArray(rawValue)) {
      const labels = rawValue.map((item) => resolveOptionLabel(field, item));
      return {
        text: labels.length ? labels.join("، ") : "-",
        file: null,
      };
    }

    const file = getUploadedFile(rawValue);
    if (file) {
      return { text: file.originalName, file };
    }

    return { text: formatPrimitiveValue(rawValue), file: null };
  };

  const extractUploadedFile = (formData: Record<string, unknown>) => {
    for (const value of Object.values(formData)) {
      if (typeof value === "object" && value !== null) {
        const candidate = value as { url?: unknown; originalName?: unknown };
        if (typeof candidate.url === "string") {
          return {
            url: candidate.url,
            name:
              typeof candidate.originalName === "string"
                ? candidate.originalName
                : "عرض الملف",
          };
        }
      }
    }

    return null;
  };

  const handleExport = () => {
    if (!registrations?.data || !event) return;

    const formatDynamicValue = (value: unknown): string => {
      if (!value) return '';
      if (Array.isArray(value)) return value.join('، ');
      if (typeof value === 'object') {
        const maybeFile = value as { originalName?: unknown; url?: unknown };
        if (typeof maybeFile.originalName === 'string') {
          return maybeFile.originalName;
        }
        if (typeof maybeFile.url === 'string') {
          return maybeFile.url;
        }
        return JSON.stringify(value);
      }
      return String(value);
    };

    const data = registrations.data.map((reg) => {
      const user = reg.user as User | undefined;
      const baseData: Record<string, unknown> = {
        "رقم التسجيل": reg.registrationNumber,
        "الاسم (عربي)": user?.fullNameAr || "ضيف",
        "الاسم (إنجليزي)": user?.fullNameEn || "Guest",
        "البريد الإلكتروني": user?.email || reg.guestEmail || "-",
        الهاتف: user?.phone || "-",
        الحالة:
          reg.status === "attended"
            ? "حضر"
            : reg.status === "confirmed"
            ? "مؤكد"
            : "معلق",
        "تاريخ التسجيل": format(new Date(reg.createdAt), "yyyy-MM-dd"),
      };

      // Add dynamic form data
      if (event.formSchema) {
        event.formSchema.forEach((field) => {
          if (field.type === "section") {
            return;
          }

          const currentValue = reg.formData[field.id];
          if (
            (field.type === "select" || field.type === "radio") &&
            field.allowOther &&
            currentValue === OTHER_OPTION_VALUE
          ) {
            baseData[field.label] = formatDynamicValue(reg.formData[getOtherFieldId(field.id)]);
            return;
          }

          baseData[field.label] = formatDynamicValue(currentValue);
        });
      }

      return baseData;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المسجلين");
    XLSX.writeFile(workbook, `registrations-${event.slug}.xlsx`);
  };

  const handleAttendance = (registrationId: string, attended: boolean) => {
    if (!id) return;
    markAttendance({ eventId: id, registrationId, attended });
  };

  if (loadingEvent) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/events">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">المسجلين</h1>
            <p className="text-muted-foreground">{event.titleAr}</p>
          </div>
        </div>
        <Button onClick={handleExport} disabled={!registrations?.data?.length}>
          <Download className="ml-2 h-4 w-4" />
          تصدير Excel
        </Button>
      </div>

      <div className="-mx-4 overflow-x-auto rounded-lg border bg-card sm:mx-0">
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              <TableHead>رقم التسجيل</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>البريد</TableHead>
              <TableHead>الحالة</TableHead>
                      <TableHead>الملفات</TableHead>
                      <TableHead>بيانات النموذج</TableHead>
                      <TableHead>تاريخ التسجيل</TableHead>
                      <TableHead>الحضور</TableHead>
                    </TableRow>
          </TableHeader>
          <TableBody>
            {loadingRegistrations ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : registrations?.data?.length ? (
              registrations.data.map((reg) => {
                const user = reg.user as User | undefined;
                const uploadedFile = extractUploadedFile(reg.formData);
                return (
                  <TableRow key={reg._id}>
                    <TableCell className="font-mono">
                      {reg.registrationNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user?.fullNameAr || "ضيف"}</p>
                        <p className="text-sm text-muted-foreground">
                          {user?.fullNameEn || "Guest"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{user?.email || reg.guestEmail || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          reg.status === "attended"
                            ? "default"
                            : reg.status === "confirmed"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {reg.status === "attended"
                          ? "حضر"
                          : reg.status === "confirmed"
                          ? "مؤكد"
                          : "معلق"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {uploadedFile ? (
                        <a
                          href={uploadedFile.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-700 underline"
                        >
                          {uploadedFile.name}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailsRegistration(reg)}
                      >
                        <FileText className="ml-2 h-4 w-4" />
                        عرض
                      </Button>
                    </TableCell>
                    <TableCell>
                      {format(new Date(reg.createdAt), "d MMM yyyy", {
                        locale: ar,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant={
                            reg.status === "attended" ? "default" : "outline"
                          }
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleAttendance(reg._id, true)}
                          disabled={isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={
                            reg.status !== "attended" ? "default" : "outline"
                          }
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleAttendance(reg._id, false)}
                          disabled={isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState
                    title="لا يوجد مسجلين"
                    description="لم يسجل أحد في هذا المؤتمر بعد"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={Boolean(detailsRegistration)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsRegistration(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader className="text-right">
            <DialogTitle>بيانات نموذج التسجيل</DialogTitle>
            <DialogDescription>
              {detailsRegistration
                ? `رقم التسجيل: ${detailsRegistration.registrationNumber}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {detailsRegistration && (
            <div className="space-y-3">
              {event.formSchema
                ?.filter((field) => field.type !== "section")
                .map((field) => {
                  const display = getFieldDisplay(field, detailsRegistration.formData);
                  return (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-[220px_1fr]"
                    >
                      <p className="text-sm font-semibold text-foreground">{field.label}</p>
                      {display.file ? (
                        <a
                          href={display.file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-fit text-sm text-primary-700 underline"
                        >
                          {display.file.originalName}
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">{display.text}</p>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
