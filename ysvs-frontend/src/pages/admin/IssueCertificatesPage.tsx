import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents, useEventRegistrations } from "@/api/hooks/useEvents";
import { useBulkGenerateCertificates } from "@/api/hooks/useCertificates";
import { EmptyState } from "@/components/shared/EmptyState";
import type { User } from "@/types";

export default function AdminIssueCertificatesPage() {
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>(
    []
  );
  const [progress, setProgress] = useState(0);

  const { data: eventsData, isLoading: loadingEvents } = useEvents({
    status: "completed",
    limit: 100,
  });

  const { data: registrations, isLoading: loadingRegistrations } =
    useEventRegistrations(selectedEvent, { limit: 100 });

  const { mutate: generateCertificates, isPending: isGenerating } =
    useBulkGenerateCertificates();

  // Filter only attended registrations without certificates
  const eligibleRegistrations =
    registrations?.data?.filter(
      (reg) => reg.status === "attended" && !reg.certificate
    ) || [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRegistrations(eligibleRegistrations.map((r) => r._id));
    } else {
      setSelectedRegistrations([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRegistrations([...selectedRegistrations, id]);
    } else {
      setSelectedRegistrations(selectedRegistrations.filter((r) => r !== id));
    }
  };

  const handleGenerate = () => {
    if (!selectedEvent || selectedRegistrations.length === 0) return;

    // Simulate progress
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 500);

    generateCertificates(
      {
        eventId: selectedEvent,
        registrationIds: selectedRegistrations,
      },
      {
        onSuccess: () => {
          clearInterval(interval);
          setProgress(100);
          setSelectedRegistrations([]);
          setTimeout(() => setProgress(0), 2000);
        },
        onError: () => {
          clearInterval(interval);
          setProgress(0);
        },
      }
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/certificates">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">إصدار الشهادات</h1>
          <p className="text-muted-foreground">إصدار شهادات للحاضرين</p>
        </div>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle>اختر المؤتمر</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger>
              <SelectValue placeholder="اختر مؤتمراً منتهياً" />
            </SelectTrigger>
            <SelectContent>
              {loadingEvents ? (
                <SelectItem value="loading" disabled>
                  جاري التحميل...
                </SelectItem>
              ) : eventsData?.data?.length ? (
                eventsData.data.map((event) => (
                  <SelectItem key={event._id} value={event._id}>
                    {event.titleAr}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="empty" disabled>
                  لا توجد مؤتمرات منتهية
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Attendees List */}
      {selectedEvent && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>الحاضرون المؤهلون للشهادات</CardTitle>
            {eligibleRegistrations.length > 0 && (
              <Button
                onClick={handleGenerate}
                disabled={selectedRegistrations.length === 0 || isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <Award className="ml-2 h-4 w-4" />
                )}
                إصدار {selectedRegistrations.length} شهادة
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isGenerating && progress > 0 && (
              <div className="mb-4">
                <Progress value={progress} className="h-2" />
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  جاري إصدار الشهادات... {progress}%
                </p>
              </div>
            )}

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          eligibleRegistrations.length > 0 &&
                          selectedRegistrations.length ===
                            eligibleRegistrations.length
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>رقم التسجيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingRegistrations ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-4" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : eligibleRegistrations.length ? (
                    eligibleRegistrations.map((reg) => {
                      const user = reg.user as User;
                      return (
                        <TableRow key={reg._id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRegistrations.includes(reg._id)}
                              onCheckedChange={(checked) =>
                                handleSelectOne(reg._id, checked as boolean)
                              }
                            />
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
                          <TableCell className="font-mono">
                            {reg.registrationNumber}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <EmptyState
                          icon={Award}
                          title="لا يوجد حاضرون مؤهلون"
                          description="جميع الحاضرين حصلوا على شهاداتهم أو لم يحضر أحد بعد"
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
