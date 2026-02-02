import { useParams, Link } from "react-router-dom";
import { ArrowRight, Download, Check, X } from "lucide-react";
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
  useEvent,
  useEventRegistrations,
  useMarkAttendance,
} from "@/api/hooks/useEvents";
import { EmptyState } from "@/components/shared/EmptyState";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import * as XLSX from "xlsx";
import type { User } from "@/types";

export default function AdminEventRegistrantsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading: loadingEvent } = useEvent(id || "");
  const { data: registrations, isLoading: loadingRegistrations } =
    useEventRegistrations(id || "");
  const { mutate: markAttendance, isPending } = useMarkAttendance();

  const handleExport = () => {
    if (!registrations?.data || !event) return;

    const data = registrations.data.map((reg) => {
      const user = reg.user as User;
      const baseData: Record<string, unknown> = {
        "رقم التسجيل": reg.registrationNumber,
        "الاسم (عربي)": user.fullNameAr,
        "الاسم (إنجليزي)": user.fullNameEn,
        "البريد الإلكتروني": user.email,
        الهاتف: user.phone,
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
          baseData[field.label] = reg.formData[field.id] || "";
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

      <div className="overflow-x-auto rounded-lg border bg-white -mx-4 sm:mx-0">
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              <TableHead>رقم التسجيل</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>البريد</TableHead>
              <TableHead>الحالة</TableHead>
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
                </TableRow>
              ))
            ) : registrations?.data?.length ? (
              registrations.data.map((reg) => {
                const user = reg.user as User;
                return (
                  <TableRow key={reg._id}>
                    <TableCell className="font-mono">
                      {reg.registrationNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.fullNameAr}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.fullNameEn}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
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
                <TableCell colSpan={6}>
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
    </div>
  );
}
