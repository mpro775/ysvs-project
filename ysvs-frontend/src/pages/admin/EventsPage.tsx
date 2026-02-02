import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents, useDeleteEvent } from "@/api/hooks/useEvents";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import type { Event } from "@/types";

const statusLabels: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  upcoming: { label: "قادم", variant: "default" },
  ongoing: { label: "جارٍ", variant: "destructive" },
  completed: { label: "منتهي", variant: "secondary" },
  cancelled: { label: "ملغي", variant: "outline" },
};

export default function AdminEventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null);

  const status = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1");

  const { data, isLoading } = useEvents({
    status: status === "all" ? undefined : status,
    search: searchParams.get("search") || undefined,
    page,
    limit: 10,
  });

  const { mutate: deleteEventMutation, isPending: isDeleting } =
    useDeleteEvent();

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

  const handleDelete = () => {
    if (deleteEvent) {
      deleteEventMutation(deleteEvent._id, {
        onSuccess: () => setDeleteEvent(null),
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">إدارة المؤتمرات</h1>
          <p className="text-sm text-muted-foreground">
            إضافة وتعديل وإدارة المؤتمرات
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/admin/events/create">
            <Plus className="ml-2 h-4 w-4" />
            إضافة مؤتمر
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ابحث عن مؤتمر..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button type="submit">بحث</Button>
        </form>

        <Select
          value={status}
          onValueChange={(value) => {
            setSearchParams((prev) => {
              if (value === "all") {
                prev.delete("status");
              } else {
                prev.set("status", value);
              }
              prev.delete("page");
              return prev;
            });
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="upcoming">قادم</SelectItem>
            <SelectItem value="ongoing">جارٍ</SelectItem>
            <SelectItem value="completed">منتهي</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-white -mx-4 sm:mx-0">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>العنوان</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>التسجيل</TableHead>
              <TableHead>المسجلين</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.data?.length ? (
              data.data.map((event) => {
                const statusInfo =
                  statusLabels[event.status] || statusLabels.upcoming;
                return (
                  <TableRow key={event._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{event.titleAr}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.titleEn}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(event.startDate), "d MMM yyyy", {
                        locale: ar,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.registrationOpen ? "default" : "secondary"
                        }
                      >
                        {event.registrationOpen ? "مفتوح" : "مغلق"}
                      </Badge>
                    </TableCell>
                    <TableCell>{event.currentAttendees}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              to={`/events/${event.slug}`}
                              target="_blank"
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              عرض
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              to={`/admin/events/${event._id}/edit`}
                              className="flex items-center gap-2"
                            >
                              <Pencil className="h-4 w-4" />
                              تعديل
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              to={`/admin/events/${event._id}/registrants`}
                              className="flex items-center gap-2"
                            >
                              <Users className="h-4 w-4" />
                              المسجلين
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteEvent(event)}
                            className="flex items-center gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState
                    title="لا توجد مؤتمرات"
                    description="لم يتم العثور على مؤتمرات مطابقة"
                    action={{
                      label: "إضافة مؤتمر",
                      onClick: () => {},
                    }}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: data.meta.totalPages }).map((_, i) => (
            <Button
              key={i}
              variant={page === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setSearchParams((prev) => {
                  prev.set("page", String(i + 1));
                  return prev;
                })
              }
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteEvent}
        onOpenChange={() => setDeleteEvent(null)}
        title="حذف المؤتمر"
        description={`هل أنت متأكد من حذف "${deleteEvent?.titleAr}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
