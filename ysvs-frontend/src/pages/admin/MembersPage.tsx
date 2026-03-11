import { type FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Users, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  useProfessionalVerifications,
  useReviewProfessionalVerification,
} from '@/api/hooks/useUsers';
import { ProfessionalVerificationStatus, type User } from '@/types';

const statusOptions = [
  { value: '', label: 'كل الحالات' },
  { value: ProfessionalVerificationStatus.NOT_SUBMITTED, label: 'لم يتم الرفع' },
  { value: ProfessionalVerificationStatus.PENDING, label: 'جاري المعالجة' },
  { value: ProfessionalVerificationStatus.APPROVED, label: 'موثق' },
  { value: ProfessionalVerificationStatus.REJECTED, label: 'مرفوض' },
];

export default function AdminMembersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');

  const filters = useMemo(
    () => ({
      page: Number(searchParams.get('page') || 1),
      limit: 20,
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') || undefined) as ProfessionalVerificationStatus | undefined,
    }),
    [searchParams],
  );

  const {
    data: membersResponse,
    isLoading,
    refetch,
  } = useProfessionalVerifications(filters);
  const { mutate: reviewProfessionalVerification, isPending: isReviewPending } =
    useReviewProfessionalVerification();

  const members = membersResponse?.data || [];

  const getStatusLabel = (member: User) => {
    const currentStatus =
      member.professionalVerification?.status || ProfessionalVerificationStatus.NOT_SUBMITTED;

    if (currentStatus === ProfessionalVerificationStatus.PENDING) return 'جاري المعالجة';
    if (currentStatus === ProfessionalVerificationStatus.APPROVED) return 'موثق';
    if (currentStatus === ProfessionalVerificationStatus.REJECTED) return 'مرفوض';
    return 'لم يتم الرفع';
  };

  const getStatusVariant = (
    member: User,
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const currentStatus =
      member.professionalVerification?.status || ProfessionalVerificationStatus.NOT_SUBMITTED;

    if (currentStatus === ProfessionalVerificationStatus.APPROVED) return 'default';
    if (currentStatus === ProfessionalVerificationStatus.REJECTED) return 'destructive';
    if (currentStatus === ProfessionalVerificationStatus.PENDING) return 'secondary';
    return 'outline';
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      if (search.trim()) prev.set('search', search.trim());
      else prev.delete('search');

      if (status) prev.set('status', status);
      else prev.delete('status');

      prev.set('page', '1');
      return prev;
    });
  };

  const handleApprove = (member: User) => {
    reviewProfessionalVerification(
      {
        userId: member._id,
        payload: { decision: 'approved' },
      },
      { onSuccess: () => refetch() },
    );
  };

  const handleReject = (member: User) => {
    const reason = window.prompt('اكتب سبب الرفض الذي سيظهر للعضو:');
    if (!reason || reason.trim().length < 5) {
      return;
    }

    reviewProfessionalVerification(
      {
        userId: member._id,
        payload: { decision: 'rejected', rejectionReason: reason.trim() },
      },
      { onSuccess: () => refetch() },
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">إدارة الأعضاء</h1>
        <p className="text-sm text-muted-foreground">مراجعة وتوثيق أعضاء الجمعية</p>
      </div>

      <form onSubmit={handleSearch} className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث باسم العضو أو البريد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {statusOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <Button type="submit">بحث</Button>
      </form>

      <div className="-mx-4 overflow-x-auto rounded-lg border bg-card sm:mx-0">
        <Table className="min-w-[920px]">
          <TableHeader>
            <TableRow>
              <TableHead>العضو</TableHead>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>بطاقة المزاولة</TableHead>
              <TableHead>سبب الرفض</TableHead>
              <TableHead>آخر تحديث</TableHead>
              <TableHead className="text-left">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-10 w-56" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-44" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-36" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-32" />
                  </TableCell>
                </TableRow>
              ))
            ) : members.length ? (
              members.map((member) => {
                const statusLabel = getStatusLabel(member);
                const canReview =
                  member.professionalVerification?.status === ProfessionalVerificationStatus.PENDING;

                return (
                  <TableRow key={member._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{member.fullNameAr.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.fullNameAr}</p>
                          <p className="text-sm text-muted-foreground">{member.fullNameEn}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(member)}>{statusLabel}</Badge>
                    </TableCell>
                    <TableCell>
                      {member.professionalVerification?.document?.url ? (
                        <a
                          href={member.professionalVerification.document.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          عرض الملف
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">غير مرفوع</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {member.professionalVerification?.rejectionReason || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {member.professionalVerification?.lastSubmittedAt
                        ? format(
                            new Date(member.professionalVerification.lastSubmittedAt),
                            'd MMM yyyy',
                            {
                              locale: ar,
                            },
                          )
                        : format(new Date(member.createdAt), 'd MMM yyyy', { locale: ar })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(member)}
                          disabled={!canReview || isReviewPending}
                          className="gap-1"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          اعتماد
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(member)}
                          disabled={!canReview || isReviewPending}
                          className="gap-1"
                        >
                          <XCircle className="h-4 w-4" />
                          رفض
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={Users}
                    title="لا توجد نتائج"
                    description="لم يتم العثور على أعضاء يطابقون معايير البحث"
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
