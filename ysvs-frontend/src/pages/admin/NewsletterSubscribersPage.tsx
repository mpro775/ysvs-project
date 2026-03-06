import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  useNewsletterSubscribers,
  useUpdateNewsletterSubscriberStatus,
} from '@/api/hooks/useContent';
import type { NewsletterSubscriber } from '@/types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

type SubscriberStatus = 'pending' | 'subscribed' | 'unsubscribed';

const STATUS_LABELS: Record<SubscriberStatus, string> = {
  pending: 'قيد الانتظار',
  subscribed: 'مشترك',
  unsubscribed: 'ملغي',
};

function getStatusVariant(status: SubscriberStatus): 'default' | 'secondary' | 'outline' {
  if (status === 'subscribed') {
    return 'default';
  }

  if (status === 'pending') {
    return 'secondary';
  }

  return 'outline';
}

function getSubscribedDate(subscriber: NewsletterSubscriber): string {
  const targetDate =
    subscriber.subscribedAt || subscriber.confirmedAt || subscriber.createdAt;

  return format(new Date(targetDate), 'd MMM yyyy', { locale: ar });
}

export default function NewsletterSubscribersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const status = searchParams.get('status') || 'all';

  const { data, isLoading } = useNewsletterSubscribers({
    page,
    limit: 10,
    status: status !== 'all' ? (status as SubscriberStatus) : undefined,
    search: searchParams.get('search') || undefined,
  });

  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateNewsletterSubscriberStatus();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      if (search.trim()) {
        prev.set('search', search.trim());
      } else {
        prev.delete('search');
      }

      prev.delete('page');
      return prev;
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">مشتركو النشرة البريدية</h1>
        <p className="text-sm text-muted-foreground">
          متابعة كل الإيميلات المسجلة في النشرة البريدية
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-2 sm:flex-row sm:gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث بالبريد الإلكتروني..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button type="submit">بحث</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSearch('');
            setSearchParams({ page: '1' });
          }}
        >
          إعادة تعيين
        </Button>
      </form>

      <div className="grid gap-2 sm:grid-cols-2">
        <Select
          value={status}
          onValueChange={(value) => {
            setSearchParams((prev) => {
              if (value === 'all') {
                prev.delete('status');
              } else {
                prev.set('status', value);
              }

              prev.delete('page');
              return prev;
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="فلترة الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="subscribed">مشترك</SelectItem>
            <SelectItem value="unsubscribed">ملغي</SelectItem>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center rounded-md border px-3 text-sm text-muted-foreground">
          العدد الكلي: {data?.meta.total?.toLocaleString('ar-EG') || 0}
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto rounded-lg border bg-card sm:mx-0">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>المصدر</TableHead>
              <TableHead>تاريخ الاشتراك</TableHead>
              <TableHead>تحديث الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-56" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-9 w-32" />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.data.length ? (
              data.data.map((subscriber) => (
                <TableRow key={subscriber._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{subscriber.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(subscriber.status)}>
                      {STATUS_LABELS[subscriber.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{subscriber.source || '-'}</TableCell>
                  <TableCell>{getSubscribedDate(subscriber)}</TableCell>
                  <TableCell>
                    <Select
                      value={subscriber.status}
                      disabled={isUpdatingStatus}
                      onValueChange={(value) => {
                        updateStatus({
                          id: subscriber._id,
                          status: value as SubscriberStatus,
                        });
                      }}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="تغيير الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subscribed">مشترك</SelectItem>
                        <SelectItem value="unsubscribed">ملغي</SelectItem>
                        <SelectItem value="pending">قيد الانتظار</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    icon={Mail}
                    title="لا يوجد مشتركون"
                    description="لم يتم العثور على أي بريد إلكتروني مطابق للفلاتر الحالية"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: data.meta.totalPages }).map((_, i) => (
            <Button
              key={i}
              variant={page === i + 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() =>
                setSearchParams((prev) => {
                  prev.set('page', String(i + 1));
                  return prev;
                })
              }
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
