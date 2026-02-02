import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Award, Ban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  useCertificates,
  useRevokeCertificate,
} from "@/api/hooks/useCertificates";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import type { Certificate } from "@/types";

export default function AdminCertificatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [revokeDialog, setRevokeDialog] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  const page = parseInt(searchParams.get("page") || "1");

  const { data, isLoading } = useCertificates({
    search: searchParams.get("search") || undefined,
    page,
    limit: 10,
  });

  const { mutate: revokeCertificate, isPending: isRevoking } =
    useRevokeCertificate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      if (search) {
        prev.set("search", search);
      } else {
        prev.delete("search");
      }
      prev.delete("page");
      return prev;
    });
  };

  const handleRevoke = () => {
    if (revokeDialog) {
      revokeCertificate(
        { id: revokeDialog._id, reason: revokeReason },
        {
          onSuccess: () => {
            setRevokeDialog(null);
            setRevokeReason("");
          },
        }
      );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">سجل الشهادات</h1>
          <p className="text-sm text-muted-foreground">جميع الشهادات الصادرة</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/admin/certificates/issue">
            <Plus className="ml-2 h-4 w-4" />
            إصدار شهادات
          </Link>
        </Button>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-2 sm:flex-row sm:gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث برقم الشهادة أو اسم المستلم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button type="submit">بحث</Button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-white -mx-4 sm:mx-0">
        <Table className="min-w-[520px]">
          <TableHeader>
            <TableRow>
              <TableHead>الرقم التسلسلي</TableHead>
              <TableHead>المستلم</TableHead>
              <TableHead>المؤتمر</TableHead>
              <TableHead>ساعات CME</TableHead>
              <TableHead>تاريخ الإصدار</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.data?.length ? (
              data.data.map((cert) => (
                <TableRow key={cert._id}>
                  <TableCell className="font-mono">
                    {cert.serialNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{cert.recipientNameAr}</p>
                      <p className="text-sm text-muted-foreground">
                        {cert.recipientNameEn}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{cert.eventTitleAr}</TableCell>
                  <TableCell>{cert.cmeHours}</TableCell>
                  <TableCell>
                    {format(new Date(cert.issueDate), "d MMM yyyy", {
                      locale: ar,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cert.isValid ? "default" : "destructive"}>
                      {cert.isValid ? "صالحة" : "ملغاة"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {cert.isValid && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRevokeDialog(cert)}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={Award}
                    title="لا توجد شهادات"
                    description="لم يتم العثور على شهادات"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Revoke Dialog */}
      <ConfirmDialog
        open={!!revokeDialog}
        onOpenChange={() => setRevokeDialog(null)}
        title="إلغاء الشهادة"
        description={`هل أنت متأكد من إلغاء شهادة "${revokeDialog?.recipientNameAr}"؟`}
        confirmText="إلغاء الشهادة"
        variant="destructive"
        onConfirm={handleRevoke}
        isLoading={isRevoking}
      />
    </div>
  );
}
